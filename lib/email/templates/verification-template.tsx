import * as React from "react";

interface VerificationTemplateProps {
  link: string;
}

export const VerificationTemplate: React.FC<Readonly<VerificationTemplateProps>> = ({
  link,
}) => (
  <div>
    <h3>Welcome, to ChapGPT Clone!</h3>
    <p>
      Click on this link to verify your email: <a href={link}>link</a>.
    </p>
  </div>
);
