/**
 * Contact Page Component
 * Contact form, map, and company information
 */

import React, { useState } from 'react';
import { 
  GeoAlt, 
  Telephone, 
  Envelope, 
  Clock,
  Send,
  CheckCircle
} from 'react-bootstrap-icons';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, send to API
      // await sendContactMessage(formData);
      
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: GeoAlt,
      title: 'Our Office',
      lines: ['123 Real Estate Blvd, Suite 100', 'New York, NY 10001']
    },
    {
      icon: Telephone,
      title: 'Phone',
      lines: ['+1 (555) 123-4567', '+1 (555) 987-6543']
    },
    {
      icon: Envelope,
      title: 'Email',
      lines: ['info@realestate.com', 'support@realestate.com']
    },
    {
      icon: Clock,
      title: 'Working Hours',
      lines: ['Mon - Fri: 9:00 AM - 6:00 PM', 'Sat: 10:00 AM - 4:00 PM']
    }
  ];

  return (
    <div className="contact-page">
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <div className="page-header-content">
            <h1 className="page-header-title">Contact Us</h1>
            <div className="page-header-breadcrumb">
              <a href="/">Home</a>
              <span>/</span>
              <span>Contact</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="section section-gray">
        <div className="container">
          <div className="row g-4">
            {contactInfo.map((info, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <div className="contact-card">
                  <div className="contact-icon">
                    <info.icon />
                  </div>
                  <h4 className="contact-title">{info.title}</h4>
                  {info.lines.map((line, i) => (
                    <p key={i} className="contact-text mb-1">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="section">
        <div className="container">
          <div className="row g-5">
            {/* Contact Form */}
            <div className="col-lg-6">
              <div className="section-header text-start mb-4">
                <p className="section-subtitle">Get In Touch</p>
                <h2 className="section-title">Send Us a Message</h2>
                <p className="section-description text-start">
                  Have questions about buying, selling, or renting? We would love to hear from you. 
                  Fill out the form below and our team will get back to you within 24 hours.
                </p>
              </div>

              {submitted ? (
                <div className="dashboard-card text-center py-5">
                  <CheckCircle size={64} className="text-success mb-3" />
                  <h3>Message Sent!</h3>
                  <p className="text-muted">
                    Thank you for contacting us. We will get back to you shortly.
                  </p>
                  <button 
                    className="btn btn-primary-custom"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} id="contact-form" noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="name" className="form-label">Full Name *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className={`form-control-custom ${errors.name ? 'is-invalid' : ''}`}
                          placeholder="Your name"
                          value={formData.name}
                          onChange={handleChange}
                        />
                        {errors.name && (
                          <div className="invalid-feedback">{errors.name}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className={`form-control-custom ${errors.email ? 'is-invalid' : ''}`}
                          placeholder="Your email"
                          value={formData.email}
                          onChange={handleChange}
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="phone" className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-control-custom"
                          placeholder="Your phone (optional)"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="subject" className="form-label">Subject *</label>
                        <select
                          id="subject"
                          name="subject"
                          className={`form-control-custom ${errors.subject ? 'is-invalid' : ''}`}
                          value={formData.subject}
                          onChange={handleChange}
                        >
                          <option value="">Select a subject</option>
                          <option value="buying">Buying a Property</option>
                          <option value="selling">Selling a Property</option>
                          <option value="renting">Renting a Property</option>
                          <option value="agent">Becoming an Agent</option>
                          <option value="support">Technical Support</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.subject && (
                          <div className="invalid-feedback">{errors.subject}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group">
                        <label htmlFor="message" className="form-label">Message *</label>
                        <textarea
                          id="message"
                          name="message"
                          className={`form-control-custom ${errors.message ? 'is-invalid' : ''}`}
                          rows="6"
                          placeholder="Your message..."
                          value={formData.message}
                          onChange={handleChange}
                        ></textarea>
                        {errors.message && (
                          <div className="invalid-feedback">{errors.message}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-primary-custom"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="me-2" /> Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Map */}
            <div className="col-lg-6">
              <div className="section-header text-start mb-4">
                <p className="section-subtitle">Find Us</p>
                <h2 className="section-title">Our Location</h2>
                <p className="section-description text-start">
                  Visit our office to meet with our agents in person. We are located in the heart of New York City.
                </p>
              </div>
              
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.11976397393817!3d40.69766374873451!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1645564756836!5m2!1sen!2s"
                  allowFullScreen
                  loading="lazy"
                  title="Office Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-header">
            <p className="section-subtitle">FAQ</p>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="dashboard-card h-100">
                <h5>How do I list my property?</h5>
                <p className="text-muted mb-0">
                  Sign up for an account, navigate to the dashboard, and click "Add Property". 
                  Fill in the details and upload photos to list your property.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="dashboard-card h-100">
                <h5>What are the fees for listing?</h5>
                <p className="text-muted mb-0">
                  Basic listings are free. Premium features and promoted listings 
                  have additional fees. Contact us for detailed pricing.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="dashboard-card h-100">
                <h5>How can I become an agent?</h5>
                <p className="text-muted mb-0">
                  Apply through our contact form or sign up with an agent role. 
                  Our team will review your application within 48 hours.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="dashboard-card h-100">
                <h5>Is my data secure?</h5>
                <p className="text-muted mb-0">
                  Yes, we use enterprise-grade security with encrypted data transmission 
                  and secure storage to protect your information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
