import { mintSkillPassport } from "../src/services/blockchainService.js";
import { supabase } from "../src/services/supabaseService.js";

export const mintPassport = async (req, res) => {
  try {
    const { name, email, skills } = req.body;

    if (!name || !email || !skills) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Mint NFT on Polygon
    const mintTx = await mintSkillPassport({ name, email, skills });

    // Store record in Supabase
    const { data, error } = await supabase.from("passports").insert([
      {
        name,
        email,
        skills,
        transaction_hash: mintTx.receipt.transactionHash,
        nft_address: mintTx.id,
      },
    ]);

    if (error) throw error;

    res.status(200).json({
      message: "Passport minted successfully!",
      transaction: mintTx.receipt.transactionHash,
      record: data,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to mint passport", details: err.message });
  }
};
