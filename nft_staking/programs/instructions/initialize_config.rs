use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};

use crate::StakeConfig;

#[derive(Accounts)]
pub struct InitializeConfig<'info>{
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        seeds = [b"config"],
        bump,
        space = 8 + StakeConfig::INIT_SPACE,
    )]
    pub config: Account<'info, StakeConfig>,

    #[account(
        init,
        payer = admin,
        seeds = [b"rewards", config.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = config
    )]
    pub reward_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeConfig<'info> {
    pub fn initialize_config(&mut self, point_per_stake: u64, max_stake: u64, freeze_period: u64, bumps: &InitializeConfigBumps) -> Result<()> {
        self.config.set_inner(StakeConfig {
            points_per_stake: point_per_stake,
            max_stake,
            freeze_period,
            reward_bump: bumps.reward_mint,
            bump: bumps.config,
        });
        Ok(())
    }
}
