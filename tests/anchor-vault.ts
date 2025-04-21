import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVault } from "../target/types/anchor_vault";
import { PublicKey, SystemProgram, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

describe("anchor-vault", () => {
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.anchorVault as Program<AnchorVault>;

  const mint = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

  let vault: PublicKey;
  let vaultState: PublicKey;

  before(async () => {
    [vault] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    [vaultState] = await PublicKey.findProgramAddress(
      [Buffer.from("state"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
  })

  it("Initializes" , async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        signer: provider.wallet.publicKey,
        mint,
        vaultState,
        vault,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).signers([provider.wallet.payer])
      .rpc();

    console.log("Your transaction signature", tx);
  });

  it("Deposit funds to the vault", async () => {
    const amount = new anchor.BN(1000);
    const tx = await program.methods.deposit(amount).accounts({
      signer: provider.wallet.publicKey,
      mint,
      vaultState,
      vault,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([provider.wallet.payer]).rpc();

    console.log("Your transaction signature", tx);
    let vaultBalance = await connection.getBalance(vault);
    console.log("Vault balance: ", vaultBalance);
  });
  
  it("Close vault", async () => {
    const tx = await program.methods.close().accounts({
      signer: provider.wallet.publicKey,
      vaultState,
      vault,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([provider.wallet.payer]).rpc();

    console.log("Your transaction signature", tx);
  })
});
