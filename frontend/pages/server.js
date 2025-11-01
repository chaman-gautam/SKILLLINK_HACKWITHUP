const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve static files

// Initialize SQLite Database
const db = new sqlite3.Database('./support.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Support tickets table
    db.run(`CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      priority TEXT DEFAULT 'Medium',
      department TEXT DEFAULT 'Technical Support',
      message TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // FAQ table
    db.run(`CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Knowledge base articles
    db.run(`CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Chat messages
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_user INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Ticket status counts
    db.run(`CREATE TABLE IF NOT EXISTS ticket_stats (
      status TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0
    )`);

    // Insert sample FAQs
    const sampleFAQs = [
      {
        question: "How do I reset my password?",
        answer: "To reset your password, go to the login page and click on 'Forgot Password'. Enter your email address and we'll send you a link to reset your password.",
        category: "Account"
      },
      {
        question: "What are your support hours?",
        answer: "Our support team is available 24/7 through email and live chat. Phone support is available from 8 AM to 8 PM EST, Monday to Friday.",
        category: "General"
      },
      {
        question: "How can I upgrade my plan?",
        answer: "You can upgrade your plan at any time from your account dashboard. Go to Billing > Plans and select the plan you want to upgrade to.",
        category: "Billing"
      },
      {
        question: "Do you offer refunds?",
        answer: "Yes, we offer a 30-day money-back guarantee on all our plans. If you're not satisfied with our service, you can request a full refund within 30 days of purchase.",
        category: "Billing"
      },
      {
        question: "How secure is my data?",
        answer: "We take security very seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and regularly undergo security audits.",
        category: "Security"
      }
    ];

    const insertFAQ = db.prepare("INSERT OR IGNORE INTO faqs (question, answer, category) VALUES (?, ?, ?)");
    sampleFAQs.forEach(faq => {
      insertFAQ.run([faq.question, faq.answer, faq.category]);
    });
    insertFAQ.finalize();

    // Insert sample knowledge base categories
    const sampleKB = [
      { title: "Getting Started Guide", category: "Getting Started", content: "Complete guide to get started with our platform..." },
      { title: "Billing FAQ", category: "Billing & Payments", content: "Common billing questions and answers..." },
      { title: "Security Best Practices", category: "Security", content: "How to keep your account secure..." },
      { title: "Mobile App Setup", category: "Mobile App", content: "Setting up our mobile application..." }
    ];

    const insertKB = db.prepare("INSERT OR IGNORE INTO knowledge_base (title, category, content) VALUES (?, ?, ?)");
    sampleKB.forEach(article => {
      insertKB.run([article.title, article.category, article.content]);
    });
    insertKB.finalize();

    // Initialize ticket stats
    const stats = [
      { status: 'Pending', count: 12 },
      { status: 'In Progress', count: 8 },
      { status: 'Resolved', count: 34 }
    ];

    const insertStat = db.prepare("INSERT OR IGNORE INTO ticket_stats (status, count) VALUES (?, ?)");
    stats.forEach(stat => {
      insertStat.run([stat.status, stat.count]);
    });
    insertStat.finalize();
  });
}

// Email configuration (using Gmail)
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Utility function to generate ticket number
function generateTicketNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `GLOW-${timestamp}${random}`;
}

// API Routes

// 1. Submit support ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { name, email, subject, priority, department, message } = req.body;
    const ticketNumber = generateTicketNumber();

    db.run(
      `INSERT INTO tickets (ticket_number, name, email, subject, priority, department, message) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ticketNumber, name, email, subject, priority, department, message],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to create ticket' 
          });
        }

        // Update ticket stats
        db.run(`UPDATE ticket_stats SET count = count + 1 WHERE status = 'Pending'`);

        // Send confirmation email (optional - will work if email configured)
        try {
          const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@glowsupport.com',
            to: email,
            subject: `Support Ticket Created: ${ticketNumber}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4cc9f0;">Thank you for contacting Glow Support!</h2>
                <p>Your support ticket has been created successfully.</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
                  <p><strong>Subject:</strong> ${subject}</p>
                  <p><strong>Priority:</strong> ${priority}</p>
                  <p><strong>Department:</strong> ${department}</p>
                </div>
                <p>We'll get back to you as soon as possible. You can check your ticket status anytime using your ticket number.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
              </div>
            `
          };

          emailTransporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('Email sending failed:', error);
            } else {
              console.log('Confirmation email sent:', info.response);
            }
          });
        } catch (emailError) {
          console.log('Email configuration issue:', emailError.message);
        }

        res.json({
          success: true,
          ticketNumber: ticketNumber,
          message: 'Support ticket created successfully'
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// 2. Get ticket status
app.get('/api/tickets/:ticketNumber', (req, res) => {
  const { ticketNumber } = req.params;

  db.get(
    `SELECT ticket_number, name, email, subject, priority, department, status, created_at, updated_at 
     FROM tickets WHERE ticket_number = ?`,
    [ticketNumber],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error' 
        });
      }

      if (!row) {
        return res.status(404).json({ 
          success: false, 
          error: 'Ticket not found' 
        });
      }

      res.json({
        success: true,
        ticket: row
      });
    }
  );
});

// 3. Get all FAQs
app.get('/api/faqs', (req, res) => {
  db.all(
    "SELECT question, answer FROM faqs WHERE is_active = 1 ORDER BY id",
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch FAQs' 
        });
      }

      res.json({
        success: true,
        faqs: rows
      });
    }
  );
});

// 4. Get knowledge base categories with article counts
app.get('/api/knowledge-base/categories', (req, res) => {
  db.all(
    `SELECT category, COUNT(*) as article_count 
     FROM knowledge_base 
     WHERE is_published = 1 
     GROUP BY category`,
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch categories' 
        });
      }

      res.json({
        success: true,
        categories: rows
      });
    }
  );
});

// 5. Get articles by category
app.get('/api/knowledge-base/category/:category', (req, res) => {
  const { category } = req.params;

  db.all(
    `SELECT id, title, content, views 
     FROM knowledge_base 
     WHERE category = ? AND is_published = 1 
     ORDER BY created_at DESC`,
    [category],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch articles' 
        });
      }

      // Update view count for each article
      rows.forEach(article => {
        db.run(`UPDATE knowledge_base SET views = views + 1 WHERE id = ?`, [article.id]);
      });

      res.json({
        success: true,
        articles: rows
      });
    }
  );
});

// 6. Get ticket statistics
app.get('/api/tickets/stats/summary', (req, res) => {
  db.all(
    "SELECT status, count FROM ticket_stats",
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch stats' 
        });
      }

      res.json({
        success: true,
        stats: rows
      });
    }
  );
});

// 7. Save chat message
app.post('/api/chat/messages', (req, res) => {
  const { session_id, message, is_user } = req.body;

  db.run(
    "INSERT INTO chat_messages (session_id, message, is_user) VALUES (?, ?, ?)",
    [session_id, message, is_user ? 1 : 0],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save message' 
        });
      }

      res.json({
        success: true,
        messageId: this.lastID
      });
    }
  );
});

// 8. Get chat history
app.get('/api/chat/messages/:session_id', (req, res) => {
  const { session_id } = req.params;

  db.all(
    `SELECT message, is_user, created_at 
     FROM chat_messages 
     WHERE session_id = ? 
     ORDER BY created_at ASC`,
    [session_id],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch messages' 
        });
      }

      res.json({
        success: true,
        messages: rows.map(row => ({
          message: row.message,
          is_user: Boolean(row.is_user),
          created_at: row.created_at
        }))
      });
    }
  );
});

// 9. Search knowledge base
app.get('/api/knowledge-base/search', (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ 
      success: false, 
      error: 'Search query required' 
    });
  }

  db.all(
    `SELECT id, title, category, content 
     FROM knowledge_base 
     WHERE (title LIKE ? OR content LIKE ?) AND is_published = 1 
     ORDER BY 
       CASE 
         WHEN title LIKE ? THEN 1 
         WHEN content LIKE ? THEN 2 
         ELSE 3 
       END`,
    [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Search failed' 
        });
      }

      res.json({
        success: true,
        results: rows,
        count: rows.length
      });
    }
  );
});

// 10. Update ticket status (for admin purposes)
app.patch('/api/tickets/:ticketNumber/status', (req, res) => {
  const { ticketNumber } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid status' 
    });
  }

  db.run(
    `UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_number = ?`,
    [status, ticketNumber],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update ticket' 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Ticket not found' 
        });
      }

      // Update ticket stats
      db.run(`UPDATE ticket_stats SET count = count + 1 WHERE status = ?`, [status]);
      db.run(`UPDATE ticket_stats SET count = count - 1 WHERE status = (SELECT status FROM tickets WHERE ticket_number = ?)`, [ticketNumber]);

      res.json({
        success: true,
        message: 'Ticket status updated successfully'
      });
    }
  );
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Glow Support Backend'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Glow Support Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

module.exports = app;