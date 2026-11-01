
import type { Metadata } from "next";
import LegalPageLayout from "../components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | UrbanSaathi",
  description:
    "Understand how UrbanSaathi handles account information, civic complaints, images and location data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Your privacy matters"
      title="Privacy Policy"
      description="Transparency is the foundation of a smarter city. Learn what information UrbanSaathi handles, why it is used and how you can contact us about your data."
      updated="November 1, 2026"
      sections={[
        {
          id: "information",
          title: "Information We Collect",
          content: (
            <>
              <p>
                Depending on how you use UrbanSaathi, the platform may collect
                the following categories of information:
              </p>
              <ul>
                <li>
                  <strong>Account information:</strong> Name, email address
                  and account authentication information.
                </li>
                <li>
                  <strong>Complaint information:</strong> Complaint
                  descriptions, categories, submitted images and status
                  information.
                </li>
                <li>
                  <strong>Location information:</strong> Location details
                  that you choose to attach to a civic complaint.
                </li>
                <li>
                  <strong>Communication information:</strong> Information
                  submitted when contacting support or using account recovery.
                </li>
                <li>
                  <strong>Technical information:</strong> Information needed
                  to operate, secure and troubleshoot the application.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "usage",
          title: "How We Use Your Information",
          content: (
            <>
              <p>Information may be used to:</p>
              <ul>
                <li>Create and manage user accounts.</li>
                <li>Verify email addresses and support password recovery.</li>
                <li>Receive and manage civic complaints.</li>
                <li>Help authorized employees and administrators process complaints.</li>
                <li>Maintain application security and prevent misuse.</li>
                <li>Improve the platform and troubleshoot technical issues.</li>
              </ul>
            </>
          ),
        },
        {
          id: "location",
          title: "Complaint Images and Location",
          content: (
            <p>
              If you submit a complaint with an image or location, that
              information may be stored and made available to authorized
              personnel for complaint review and management. Submit only
              information relevant to your complaint. Avoid including
              unnecessary sensitive personal information in uploaded images.
            </p>
          ),
        },
        {
          id: "sharing",
          title: "Information Sharing",
          content: (
            <p>
              Information may be accessible to authorized administrators and
              employees who need it to operate the platform and process
              complaints. It may also be processed by infrastructure and
              service providers used for hosting, database storage, image
              management and email delivery. We do not sell personal
              information, subject to the actual practices and applicable
              requirements of the platform.
            </p>
          ),
        },
        {
          id: "security",
          title: "Data Security",
          content: (
            <p>
              Reasonable technical and organizational measures are intended
              to protect information against unauthorized access, alteration
              and disclosure. However, no internet-based service can guarantee
              absolute security. Keep your account credentials confidential
              and contact us if you suspect unauthorized access.
            </p>
          ),
        },
        {
          id: "retention",
          title: "Data Retention",
          content: (
            <p>
              Information may be retained for as long as necessary for the
              purposes for which it was collected, including platform
              operation, complaint records, security and legitimate
              operational requirements. Actual retention periods depend on
              the type of information and applicable requirements.
            </p>
          ),
        },
        {
          id: "rights",
          title: "Your Choices and Requests",
          content: (
            <p>
              You should provide accurate information and avoid submitting
              unnecessary sensitive information. You may contact us with
              questions or requests concerning your personal information.
              Requests will be reviewed subject to applicable requirements
              and the platform's record-management needs.
            </p>
          ),
        },
        {
          id: "third-party",
          title: "Third-Party Services",
          content: (
            <p>
              UrbanSaathi may rely on third-party infrastructure and service
              providers. Their handling of information is governed by their
              respective terms and privacy policies. We encourage users to
              review those policies where applicable.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to This Policy",
          content: (
            <p>
              This policy may be updated as UrbanSaathi changes. The latest
              version will be published on this page with its updated date.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact and Privacy Questions",
          content: (
            <p>
              For privacy-related questions or requests, email us at{" "}
              <a
                href="mailto:verifyyourdetails123@gmail.com"
                className="font-semibold text-blue-700 underline underline-offset-4"
              >
                verifyyourdetails123@gmail.com
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
