import React from 'react';
import { SupportPageLayout, SupportSection } from '@/components/SupportPageLayout';

export default function TermsOfServiceScreen() {
  return (
    <SupportPageLayout title="Terms of Service">
      <SupportSection>
        Last updated: July 2026. By using ChamaYetu, you agree to these terms.
      </SupportSection>

      <SupportSection heading="Your account">
        You're responsible for keeping your login credentials secure and for the accuracy of financial
        records (contributions, expenses, loans) you or your organization's members enter.
      </SupportSection>

      <SupportSection heading="Organization data">
        Each organization's admins and treasurers are responsible for how their organization uses the app,
        including who they invite and what roles they assign.
      </SupportSection>

      <SupportSection heading="Not a licensed financial institution">
        ChamaYetu is a record-keeping and coordination tool for savings groups. It does not hold funds on
        your behalf, is not a bank, and is not a substitute for licensed financial or legal advice.
      </SupportSection>

      <SupportSection heading="Acceptable use">
        Don't use ChamaYetu for fraudulent transactions, to misrepresent an organization's finances to its
        members, or to attempt to access data belonging to organizations you're not a member of.
      </SupportSection>

      <SupportSection heading="Changes">
        We may update these terms from time to time. Continued use of the app after changes means you
        accept the updated terms.
      </SupportSection>
    </SupportPageLayout>
  );
}
