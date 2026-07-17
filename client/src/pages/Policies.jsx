import SunGraphic from '../components/SunGraphic'

function Policies() {
  return (
    <section className="section">
      <div className="container policy-page">
        <SunGraphic className="page-sun" />
        <h1>Policies</h1>
        <p className="section-subtext">
          These policies are written to be clear, fair, and realistic for a
          small family-run shop with limited-stock pieces.
        </p>

        <div className="policy-stack">
          <div className="policy-card">
            <h2>Shipping Policy</h2>
            <p>
              Ready-to-ship orders are usually packed within 2-4 business days.
              Delivery timing depends on the shipping option selected at
              checkout. Once an order is marked shipped, you will receive the
              tracking details if available.
            </p>
          </div>

          <div className="policy-card">
            <h2>Address Accuracy</h2>
            <p>
              Customers are responsible for entering the correct shipping
              address at checkout. If you notice an address issue, contact us as
              quickly as possible. We cannot guarantee changes once an order has
              already been packed or shipped.
            </p>
          </div>

          <div className="policy-card">
            <h2>Returns & Exchanges</h2>
            <p>
              Because many SUNBOUND BOHEME items are one-of-one, vintage,
              resale, or limited-run pieces, returns and exchanges are reviewed
              case by case. Approval depends on item condition, listing
              accuracy, and the reason for the request.
            </p>
          </div>

          <div className="policy-card">
            <h2>Return Window</h2>
            <p>
              If your order may qualify for a return, please contact us within 7
              days of confirmed delivery. Approved returns must be sent back in
              the same condition in which they were received.
            </p>
          </div>

          <div className="policy-card">
            <h2>Damaged or Incorrect Orders</h2>
            <p>
              If something arrives damaged beyond the description provided, or
              you receive the wrong item, contact us with clear photos of the
              item and packaging. We will review the situation and work toward a
              fair resolution.
            </p>
          </div>

          <div className="policy-card">
            <h2>Privacy</h2>
            <p>
              We use the information you provide at checkout to process orders,
              communicate about purchases, and provide support. Payment details
              are handled by Stripe. We do not sell customer information.
            </p>
          </div>

          <div className="policy-card">
            <h2>Email Communication</h2>
            <p>
              If email notifications are enabled, we may send order
              confirmations, shipping updates, or support follow-ups related to
              your purchase. These emails are transactional, not a marketing
              newsletter.
            </p>
          </div>

          <div className="policy-card">
            <h2>Policy Abuse</h2>
            <p>
              We reserve the right to deny returns, refunds, or future orders in
              cases of suspected fraud, repeated abuse, dishonest claims, or
              misuse of store policies.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Policies
