import React from 'react';
import { SupportPageLayout, SupportSection } from '@/components/SupportPageLayout';

export default function PrivacyPolicyScreen() {
  return (
    <SupportPageLayout title="Privacy Policy">
      <SupportSection>
        Last updated: July 2026. This policy explains how ChamaYetu collects, uses, and protects your
        information in line with Kenya's Data Protection Act, 2019.
      </SupportSection>

      <SupportSection heading="Information we collect">
        Account details you provide at signup (name, email, phone), organization and membership data you
        create (contributions, loans, expenses, meetings), and basic device/usage data needed to keep the
        app working reliably.
      </SupportSection>

      <SupportSection heading="How we use it">
        To run your organization's chama functions — recording transactions, computing balances, showing
        member activity, and powering the AI assistant's insights about your own organization's data.
        We do not sell your personal data to third parties.
      </SupportSection>

      <SupportSection heading="Data sharing">
        Data is only visible to members of your own organization, scoped by row-level security in our
        database. Payment processing (e.g. M-Pesa) may involve sharing necessary transaction details with
        licensed payment providers to complete a transaction.
      </SupportSection>

      <SupportSection heading="Your rights">
        Under the Data Protection Act, 2019, you may request access to, correction of, or deletion of your
        personal data. Contact us via the Contact Support page to make a request.
      </SupportSection>

      <SupportSection heading="Data retention">
        We retain organization financial records for as long as your organization remains active, since
        chama records typically need to persist for accountability among members.
      </SupportSection>
    </SupportPageLayout>
  );
}
