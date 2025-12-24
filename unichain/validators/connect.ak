use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction}

pub type LoanDatum {
  borrower_id: VerificationKeyHash,
  lender_id: VerificationKeyHash,
  loan_amount: Int,
  repayment_deadline: Int,
}

pub type Action {
  Repay
  ClaimCollateral
}

validator loan_enforcer {
  spend(
    datum: Option<LoanDatum>,
    redeemer: Action,
    _input: OutputReference,
    transaction: Transaction,
  ) {
    // 1. Unpack the datum (The 'Digital Agreement')
    expect Some(d) = datum

    // 2. Check signatures for the trust gap (Stopping forgery)
    let signed_by_borrower = list.has(transaction.extra_signatories, d.borrower_id)
    let signed_by_lender = list.has(transaction.extra_signatories, d.lender_id)

    when redeemer is {
      // Borrower unlocks assets by proving identity via signature
      Repay -> signed_by_borrower

      // Lender enforces the deal after the time has expired
      ClaimCollateral -> {
        let must_be_after_deadline = 
          when transaction.validity_range.lower_bound.bound is {
            // Check current blockchain time vs the agreed deadline
            Finite(now) -> now >= d.repayment_deadline
            _ -> false
          }
        must_be_after_deadline && signed_by_lender
      }
    }
  }
}