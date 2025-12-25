{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE TemplateHaskell #-}

module Loan where

import PlutusTx
import PlutusTx.Prelude
import Ledger
import Ledger.Contexts

-- Datum: Loan information stored on-chain
data LoanDatum = LoanDatum
  { lender   :: PubKeyHash
  , borrower :: PubKeyHash
  , amount   :: Integer
  , deadline :: POSIXTime
  }

PlutusTx.unstableMakeIsData ''LoanDatum

-- Redeemer: action type
data LoanAction = Repay | Claim

PlutusTx.unstableMakeIsData ''LoanAction

-- Validator logic
{-# INLINABLE mkLoanValidator #-}
mkLoanValidator :: LoanDatum -> LoanAction -> ScriptContext -> Bool
mkLoanValidator dat action ctx =
  case action of
    Repay -> repayOK
    Claim -> claimOK
  where
    info :: TxInfo
    info = scriptContextTxInfo ctx

    -- Borrower repayment rules
    repayOK :: Bool
    repayOK =
      traceIfFalse "borrower not signed" signedByBorrower &&
      traceIfFalse "too late" beforeDeadline &&
      traceIfFalse "wrong amount" paidBack

    signedByBorrower = txSignedBy info (borrower dat)
    beforeDeadline   = to (deadline dat) `contains` txInfoValidRange info
    paidBack         = valuePaidTo info (lender dat) `geq` lovelaceValueOf (amount dat)

    -- Lender claim rules (loan default)
    claimOK :: Bool
    claimOK =
      traceIfFalse "lender not signed" signedByLender &&
      traceIfFalse "too early" afterDeadline

    signedByLender = txSignedBy info (lender dat)
    afterDeadline  = from (deadline dat) `contains` txInfoValidRange info

-- Wrap validator
{-# INLINABLE wrapped #-}
wrapped :: BuiltinData -> BuiltinData -> BuiltinData -> ()
wrapped = wrapValidator mkLoanValidator

validator :: Validator
validator = mkValidatorScript $$(PlutusTx.compile [|| wrapped ||])
