// src/components/Footer.jsx (Simplified version)
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-3 mt-5">
      <Container fluid>
        <Row className="align-items-center">
          <Col md={4} className="text-center text-md-start mb-2 mb-md-0">
            <span className="small">
              <i className="fa-regular fa-copyright me-1"></i>
              {currentYear} Fresh Super Market
            </span>
          </Col>
          <Col md={4} className="text-center mb-2 mb-md-0">
            <span className="small">
              <i className="fa-solid fa-store me-2 text-success"></i>
              Your Trusted Grocery Store
            </span>
          </Col>
          <Col md={4} className="text-center text-md-end">
            <span className="small">
              <i className="fa-solid fa-heart text-danger mx-1"></i>
              All rights reserved
            </span>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;