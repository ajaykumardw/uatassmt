"use client";

import React, { useEffect, useState } from "react";

import { Card, Typography, Box, Paper, Divider } from "@mui/material";

import classnames from "classnames";

import frontCommonStyles from "@views/front-pages/styles.module.css";

/** TYPES */
type PolicySection = {
  title: string;
};

type ContentMap = Record<string, string>;

const privacyPolicy: PolicySection[] = [
  { title: "1. Introduction" },
  { title: "2. Information We Collect" },
  { title: "3. Permissions" },
  { title: "4. How We Use Your Information" },
  { title: "5. Sharing of Information" },
  { title: "6. Data Security" },
  { title: "7. Data Retention" },
  { title: "8. Cookies & Analytics" },
  { title: "9. Third-Party Services" },
  { title: "10. Children’s Privacy" },
  { title: "11. Your Rights" },
  { title: "12. Changes to This Privacy Policy" },
  { title: "13. Contact Us" },
  { title: "14. Consent" },
];

const content: ContentMap = {
  "1. Introduction":
    "SkillLens is an assessment, learning, training, and career-readiness platform designed for students, educational institutions, recruiters, and training organizations. By accessing or using the SkillLens mobile application, website, or services, you agree to the collection and use of information in accordance with this Privacy Policy.",

  "2. Information We Collect":
    "We may collect Personal Information (name, mobile number, email, DOB, education, institution, resume, profile photo), Assessment Data (scores, analytics, progress, certifications), and Technical Data (device info, IP address, logs, app usage, identifiers).",

  "3. Permissions":
    "The application may request access to Camera, Microphone, Storage, and Internet connection strictly for functionality such as profile uploads, assessments, communication, and document uploads.",

  "4. How We Use Your Information":
    "We use your data to create accounts, conduct assessments, generate reports, provide training recommendations, improve services, enable recruitment features, send notifications, prevent fraud, and comply with legal obligations.",

  "5. Sharing of Information":
    "We do not sell personal data. Information may be shared with institutions, recruiters (with consent), service providers, and legal authorities when required.",

  "6. Data Security":
    "We use administrative, technical, and security measures to protect data from unauthorized access, loss, or misuse.",

  "7. Data Retention":
    "Data is retained as long as necessary for educational, operational, compliance, and legal purposes.",

  "8. Cookies & Analytics":
    "We use cookies, SDKs, and analytics tools to improve performance and user experience.",

  "9. Third-Party Services":
    "SkillLens may integrate with third-party services such as video tools, payment gateways, and recruitment platforms.",

  "10. Children’s Privacy":
    "SkillLens is intended for students and professionals. Minors should use under supervision where required.",

  "11. Your Rights":
    "Users may access, correct, delete, or withdraw consent for their personal data.",

  "12. Changes to This Privacy Policy":
    "We may update this Privacy Policy at any time. Updates will be published on https://www.skilllens.in",

  "13. Contact Us":
    "Website: https://www.skilllens.in\nEmail: info@skilllens.in\nPhone: +91-XXXXXXXXXX",

  "14. Consent":
    "By using SkillLens, you agree to this Privacy Policy.",
};

const PolicyPage: React.FC = () => {
  const [active, setActive] = useState<string>("");

  const scrollToSection = (id: string): void => {
    const el = document.getElementById(id);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const handleScroll = (): void => {
      let current = "";

      privacyPolicy.forEach((item) => {
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
      style={{
        display: "flex",
        gap: "24px",
        alignItems: "flex-start",
      }}
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

          {privacyPolicy.map((item) => (
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
          <Typography variant="h4" align="center">
            Privacy Policy
          </Typography>

          <Typography variant="subtitle1" align="center">
            Dream Tech Infotel - SkillLens Mobile Application
          </Typography>

          <Typography variant="body2" align="center">
            Effective Date: 28 May 2026
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" paragraph>
            Welcome to SkillLens, owned and operated by Dream Tech Infotel.
          </Typography>
          <Typography variant="body1" paragraph>
            Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you use the SkillLens mobile application and related services.
          </Typography>
          <Typography variant="body1" paragraph>
            This policy has been drafted by taking general structural reference from the existing SkillLens website privacy framework and adapting it specifically for the SkillLens mobile application owned by Dream Tech Infotel.
          </Typography>

          {privacyPolicy.map((section) => (
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
          ))}
        </Paper>
      </Card>
    </div>
  );
};

export default PolicyPage;
