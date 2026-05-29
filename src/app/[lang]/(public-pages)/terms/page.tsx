"use client";
import React, { useEffect, useState } from "react";

import Link from "next/link";

import { Card, Typography, Paper, Divider } from "@mui/material";

import classnames from "classnames";

import frontCommonStyles from "@views/front-pages/styles.module.css";

const terms = [
  { title: "1. About SkillLens" },
  { title: "2. Acceptance of Terms" },
  { title: "3. User Registration & Account" },
  { title: "4. Permitted Use" },
  { title: "5. Assessments & Certifications" },
  { title: "6. Online Learning Modules" },
  { title: "Refund Policy" },
  { title: "7. Intellectual Property Rights" },
  { title: "8. User Content" },
  { title: "9. Communication Consent" },
  { title: "10. Privacy" },
  { title: "11. Third-Party Services" },
  { title: "12. Limitation of Liability" },
  { title: "13. Suspension & Termination" },
  { title: "14. Governing Law" },
  { title: "15. Changes to Terms" },
  { title: "16. Contact Information" },
  { title: "17. User Acknowledgement" },
];


const TermsPage = () => {
  const [active, setActive] = useState("");

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      let current = "";

      terms.forEach((item) => {
        const el = document.getElementById(item.title);

        if (el) {
          const rect = el.getBoundingClientRect();

          if (rect.top <= 120) {
            current = item.title;
          }
        }
      });

      setActive(current);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={classnames("plb-12", frontCommonStyles.layoutSpacing)}
      style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}
    >
      {/* SIDEBAR */}
      <Card
        sx={{
          width: "260px",
          position: "sticky",
          top: "100px",
          display: { xs: "none", md: "block" },
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Table of Contents
          </Typography>

          {terms.map((item) => (
            <Typography
              key={item.title}
              onClick={() => scrollToSection(item.title)}
              sx={{
                cursor: "pointer",
                fontSize: "13px",
                mb: 1,
              }}
              className={classnames("hover:text-primary", {"text-primary": active === item.title})}
            >
              {item.title}
            </Typography>
          ))}
        </Paper>
      </Card>

      {/* MAIN CONTENT */}
      <Card sx={{ flex: 1 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Title */}
          <Typography variant="h4" align="center">
            Terms & Conditions
          </Typography>

          <Typography variant="subtitle1" align="center">
            Dream Tech Infotel - SkillLens Mobile Application
          </Typography>

          <Typography variant="body2" align="center">
            Effective Date: 28 May 2026
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Intro */}
          <Typography variant="body1" paragraph>
            Welcome to SkillLens, owned and operated by Dream Tech Infotel.
          </Typography>
          <Typography variant="body1" paragraph>
            These Terms & Conditions (“Terms”) govern your access to and use of the SkillLens mobile application, website, assessments, learning modules, services, and related platforms available through:
          </Typography>
          <Typography component={Link} href="https://www.skilllens.in" target="_blank" rel="noopener noreferrer" paragraph color="primary">
            https://www.skilllens.in
          </Typography>
          <Typography variant="body1" paragraph>
            By downloading, accessing, or using the SkillLens application or website, you agree to comply with these Terms & Conditions.
          </Typography>
          <Typography variant="body1" paragraph>
            The structure and nature of these terms have been generally referenced from existing industry-standard educational and assessment platform policies.
          </Typography>

          <div>
            <Typography variant="h6" gutterBottom>
              1. About SkillLens
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              SkillLens is a skill assessment, employability, learning, and training platform designed for:
            </Typography>
            <ul>
              <li>Students</li>
              <li>Educational Institutions</li>
              <li>Recruiters</li>
              <li>Training Organizations</li>
              <li>Employers</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              The platform provides assessments, analytics, training modules, certifications, and placement-readiness solutions.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              2. Acceptance of Terms
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              By using the SkillLens mobile application or website, you confirm that:
            </Typography>
            <ul>
              <li>You are legally capable of entering into this agreement; or</li>
              <li>You are using the platform under the supervision of a parent, guardian, institution, or organization where applicable.</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              If you do not agree with these Terms, please discontinue use of the platform immediately.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              3. User Registration & Account
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              To access certain services, users may be required to create an account.
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              You agree to:
            </Typography>
            <ul>
              <li>Provide accurate and complete information </li>
              <li>Maintain confidentiality of login credentials</li>
              <li>Accept responsibility for activities under your account</li>
              <li>Notify us immediately of unauthorized account usage</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Dream Tech Infotel reserves the right to suspend or terminate accounts found using false, misleading, or fraudulent information.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              4. Permitted Use
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Users may use SkillLens only for lawful educational, assessment, recruitment, and training purposes.
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              You agree NOT to:
            </Typography>
            <ul>
              <li>Copy or reproduce platform content without permission</li>
              <li>Share assessment answers or confidential material </li>
              <li>Attempt unauthorized access to the platform </li>
              <li>Upload harmful software, viruses, or malicious code </li>
              <li>Use automated systems to manipulate assessments </li>
              <li>Impersonate another user or organization </li>
              <li>Misuse certificates, reports, or platform analytics</li>
            </ul>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              5. Assessments & Certifications
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              SkillLens provides:
            </Typography>
            <ul>
              <li>Aptitude assessments</li>
              <li>Coding evaluations</li>
              <li>Communication assessments</li>
              <li>Skill analytics</li>
              <li>Learning modules</li>
              <li>Training programs</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Assessment scores and certifications are generated based on system evaluations and user performance. These results are intended for educational and employability purposes only and do not guarantee employment, admission, or selection.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              6. Online Learning Modules
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              SkillLens may provide online courses, recorded content, assessments, or training programs.
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Dream Tech Infotel reserves the right to:
            </Typography>
            <ul>
              <li>Modify course content</li>
              <li>Update learning materials</li>
              <li>Change assessment patterns</li>
              <li>Revise access duration</li>
              <li>Suspend or discontinue programs</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Temporary interruptions may occur due to technical maintenance, internet disruptions, or force majeure events.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              Refund Policy
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Refunds, if applicable, shall be reviewed on a case-by-case basis.
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              No refund shall be provided in cases involving:
            </Typography>
            <ul>
              <li>Violation of platform policies</li>
              <li>Misuse of assessments</li>
              <li>Unauthorized sharing of content</li>
              <li>Fraudulent activities</li>
              <li>Completion of significant course or assessment usage</li>
            </ul>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              7. Intellectual Property Rights
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              All platform content including:
            </Typography>
            <ul>
              <li>Logos</li>
              <li>Graphics</li>
              <li>Assessments</li>
              <li>Reports</li>
              <li>Course materials</li>
              <li>Videos</li>
              <li>Documents</li>
              <li>Software</li>
              <li>Designs</li>
              <li>Analytics</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              are the intellectual property of Dream Tech Infotel or its licensors and are protected under applicable intellectual property laws.
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Users may not:
            </Typography>
            <ul>
              <li>Copy</li>
              <li>Distribute</li>
              <li>Modify</li>
              <li>Republish</li>
              <li>Commercially exploit</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              any platform content without written permission.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              8. User Content
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Users may upload:
            </Typography>
            <ul>
              <li>Resume information</li>
              <li>Documents</li>
              <li>Images</li>
              <li>Assignment submissions</li>
              <li>Feedback</li>
              <li>Profile information</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              By uploading content, you grant Dream Tech Infotel a limited right to use such content solely for platform operations, assessments, analytics, training, and recruitment-related services.
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Users remain responsible for the legality and authenticity of uploaded content.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              9. Communication Consent
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              By using SkillLens, you consent to receive:
            </Typography>
            <ul>
              <li>Emails</li>
              <li>SMS messages</li>
              <li>Push notifications</li>
              <li>Assessment alerts</li>
              <li>Promotional updates</li>
              <li>Training and placement notifications</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Users may opt out of promotional communications where applicable.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              10. Privacy
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Use of SkillLens is also governed by our Privacy Policy available at:
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              SkillLens Privacy Policy
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              By using the platform, you consent to the collection and processing of data as described in the Privacy Policy.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              11. Third-Party Services
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              The platform may integrate with third-party services such as:
            </Typography>
            <ul>
              <li>Video conferencing tools</li>
              <li>Payment gateways</li>
              <li>Cloud hosting services</li>
              <li>Recruitment systems</li>
              <li>Analytics providers</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Dream Tech Infotel is not responsible for third-party service interruptions or policies.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              12. Limitation of Liability
            </Typography>
            <ul>
              <li>Technical interruptions</li>
              <li>Data loss</li>
              <li>Internet failures</li>
              <li>Assessment delays</li>
              <li>Indirect or consequential damages</li>
              <li>Employment or admission decisions made by third parties</li>
            </ul>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              All services are provided on an “as available” and “as is” basis.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              13. Suspension & Termination
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Dream Tech Infotel reserves the right to suspend or terminate access without prior notice if a user:
            </Typography>
            <ul>
              <li>Violates these Terms</li>
              <li>Engages in cheating or malpractice</li>
              <li>Misuses platform resources</li>
              <li>Attempts unauthorized system access</li>
              <li>Causes harm to the platform or other users</li>
            </ul>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              14. Governing Law
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              These Terms & Conditions shall be governed by and interpreted in accordance with the laws of India.
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Any disputes arising out of platform usage shall be subject to the jurisdiction of competent courts in India.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              15. Changes to Terms
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Dream Tech Infotel reserves the right to update or revise these Terms at any time.
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Updated versions shall be published on:
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              SkillLens Official Website
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Continued use of the platform after updates constitutes acceptance of revised Terms.
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              16. Contact Information
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              Dream Tech Infotel - SkillLens
            </Typography>
            <Typography variant="body2">
              Website: www.skilllens.in
            </Typography>
            <Typography variant="body2">
              Email: info@skilllens.in
            </Typography>
            <Typography variant="body2">
              Phone: +91-XXXXXXXXXX
            </Typography>
          </div>
          <div>
            <Typography variant="h6" gutterBottom>
              17. User Acknowledgement
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line" paragraph>
              By downloading, registering, or using the SkillLens mobile application or website, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.
            </Typography>
          </div>

          {/* Sections */}
          {/* {terms.map((section) => (
            <Box
              key={section.title}
              id={section.title}
              sx={{ mt: 5, scrollMarginTop: "120px" }}
            >
              <Typography variant="h6" gutterBottom>
                {section.title}
              </Typography>

              <Typography variant="body2" whiteSpace="pre-line" paragraph>
                {content[section.title]}
              </Typography>
            </Box>
          ))} */}
        </Paper>
      </Card>
    </div>
  );
};

export default TermsPage;
