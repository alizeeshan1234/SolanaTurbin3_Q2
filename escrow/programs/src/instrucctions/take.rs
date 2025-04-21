use anchor_lang::prelude::*;

use anchor_spl::token::{close_account, transfer_checked, CloseAccount, Mint, Token, TokenAccount, TransferChecked};
use anchor_spl::associated_token::AssociatedToken;
use crate::instructions::escrow::Escrow;

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    pub maker: SystemAccount<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub mint_a: Account<'info, Mint>,

    #[account(
        mint::token_program = token_program
    )]
    pub mint_b: Account<'info, Mint>,

    #[account(
        init,
        payer = taker,
        associated_token::mint = mint_a,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_ata_a: Account<'info, TokenAccount>,

    #[account(
        mut, 
        associated_token::mint = mint_b, 
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_ata_b: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = taker,
        associated_token::mint = mint_b, 
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )] 
    pub maker_ata_b: Account<'info, TokenAccount>, 

    #[account(
        mut,
        seeds = [b"escrow", maker.key().as_ref()],
        bump,
        close = maker,
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        close = maker
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Take<'info> {
    pub fn deposit(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked {
            from: self.taker_ata_a.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            mint: self.mint_b.to_account_info(),
            authority: self.taker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, self.escrow.receive, self.mint_b.decimals)?;

        Ok(())
    }

    pub fn release(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            mint: self.mint_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let maker = self.maker.key();
        let escrow_seeds: &[&[&[u8]]] = &[
            &[
                b"escrow",
                maker.as_ref(),
                &[self.escrow.bump as u8]
            ]
        ];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, escrow_seeds);

        transfer_checked(cpi_ctx, self.escrow.receive, self.mint_a.decimals)?;

        Ok(())
    }

    pub fn close(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.taker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let maker = self.maker.key();
        let escrow_seeds: &[&[&[u8]]] = &[
            &[
                b"escrow",
                maker.as_ref(),
                &[self.escrow.bump as u8]
            ]
        ];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, escrow_seeds);

        close_account(cpi_ctx)?;

        Ok(())
    }
}
