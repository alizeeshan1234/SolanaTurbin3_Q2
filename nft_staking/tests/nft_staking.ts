import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftStaking } from "../target/types/nft_staking";
import {Keypair , PublicKey, SystemProgram} from "@solana/web3.js";
import { createMint, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

let provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

let configAccount: PublicKey;

let rewardMintAccount: PublicKey;

let program = anchor.workspace.NftStaking as Program<NftStaking>;

let userWallet = Keypair.generate();

let userAccount: PublicKey;

let NFTmint: PublicKey;

let collectionMint: PublicKey;

let metadataAccount: PublicKey;

let masterEditionAccount: PublicKey;

let stakeAccount: PublicKey;

let metadataProgram = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

let mintATA: PublicKey;

before(async () => {

  const transactionSignature = await provider.connection.requestAirdrop(
    userWallet.publicKey,
    anchor.web3.LAMPORTS_PER_SOL * 2,
  );

  await provider.connection.confirmTransaction(transactionSignature);

  NFTmint = await createMint(
    provider.connection,
    userWallet,
    userWallet.publicKey,
    userAccount,
    1
  );

  collectionMint = await createMint(
    provider.connection,
    provider.wallet.payer,
    provider.wallet.publicKey,
    provider.wallet.publicKey,
    1
  );

  [configAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId,
  );

  [rewardMintAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("reward"), configAccount.toBuffer()],
    program.programId,
  );

  [userAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userWallet.publicKey.toBuffer()],
    program.programId
  );

  [metadataAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), metadataProgram.toBuffer(), NFTmint.toBuffer()],
    metadataProgram
  );

  [masterEditionAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), metadataProgram.toBuffer(), NFTmint.toBuffer(), Buffer.from("edition")],
    metadataProgram,
  );

  [stakeAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("stake"), configAccount.toBuffer(), NFTmint.toBuffer()],
    metadataProgram,
  );

  mintATA = await getAssociatedTokenAddress(NFTmint, userWallet.publicKey);
})

describe("nft-staking", () => {
  it("Initialized Config", async () => {
    const points_per_stake = new anchor.BN(10);
    const max_stake = new anchor.BN(1);
    const freezePeriod = new anchor.BN(10939302);

    const tx = await program.methods.initConfig(points_per_stake, max_stake, freezePeriod).accounts({
      admin: provider.wallet.publicKey,
      config: configAccount,
      rewardMintAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).signers([provider.wallet.payer]).rpc();

    console.log(`Transaction Signature: ${tx}`);
  });

  it("Initialize user account", async () => {
    const tx = await program.methods.initUser().accounts({
      user: userWallet.publicKey,
      userAccount,
      systemProgram: SystemProgram.programId,
    }).signers([userWallet]).rpc();

    console.log(`Transaction Signature: ${tx}`);
  });

  it("Stake NFT", async () => {
    const tx = await program.methods.stakeNft().accounts({
      user: userWallet.publicKey,
      mint: NFTmint,
      collectionMint,
      mintATA,
      metadata: metadataAccount,
      masterEditionAccount,
      stakeAccount,
      config: configAccount,
      userAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      metadataProgram,
      systemProgram: SystemProgram.programId,
    }).signers([userWallet]).rpc();

    console.log(`Transaction Signature: ${tx}`);
  })
});
