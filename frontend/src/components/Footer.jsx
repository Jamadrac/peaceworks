import './Footer.css'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          <div className="logo">
            PIECEWORKS <strong>ZAMBIA</strong>
          </div>
          <div className="footer-links">
            <a href="#/about">About Us</a>
            <a href="#/contact">Contact</a>
            <a href="#/safety">Safety Tips</a>
            <a href="#/terms">Terms</a>
            <a href="#/privacy">Privacy</a>
            <a href="#/for-task-posters">For Task Posters</a>
            <a href="#/for-workers">For Workers</a>
          </div>
          <div className="contact-info">
            <p>
              <i className="fas fa-envelope"></i> hello@pieceworks-zm.co.zm
            </p>
            <p>
              <i className="fas fa-phone"></i> +260 211 123 456 |{' '}
              <i className="fas fa-map-marker-alt"></i> Lusaka, Zambia
            </p>
          </div>
          <p className="footnote">
            © 2023 Pieceworks Zambia. Neighbors helping neighbors, one task at a time.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
