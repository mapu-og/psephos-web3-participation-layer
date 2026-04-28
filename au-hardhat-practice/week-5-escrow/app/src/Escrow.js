export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  handleApprove,
  isApproved,
}) {
  return (
    <div className="escrow-item">
      <ul>
        <li>
          <label>Dictaminator</label>
          <span style={{ fontSize: '11px' }}>{arbiter}</span>
        </li>
        <li>
          <label>Beneficiary</label>
          <span style={{ fontSize: '11px' }}>{beneficiary}</span>
        </li>
        <li>
          <label>Value</label>
          <span style={{ color: '#f472b6', fontWeight: 'bold' }}>{value} ETH</span>
        </li>
      </ul>
      {isApproved ? (
        <div className="complete" id={address}>⚖️ Dictaminator Approved!</div>
      ) : (
        <button
          className="action-btn"
          id={address}
          style={{ marginTop: '20px', padding: '12px', fontSize: '14px' }}
          onClick={(e) => {
            e.preventDefault();
            handleApprove();
          }}
        >
          Issue Verdict (Approve)
        </button>
      )}
    </div>
  );
}
