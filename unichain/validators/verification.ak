use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction}

pub type CredentialDatum {
  doc_hash: ByteArray,
  issuer_id: VerificationKeyHash,
}

pub type Action {
  Publish
  Revoke
}

validator credential_store {
  spend(
    datum: Option<CredentialDatum>,
    _redeemer: Action,
    _input: OutputReference,
    transaction: Transaction,
  ) {
    expect Some(d) = datum
    list.has(transaction.extra_signatories, d.issuer_id)
  }
}