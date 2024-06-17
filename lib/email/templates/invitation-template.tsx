import * as React from "react";

interface InvitationTemplateProps {
  link: string;
}

export const InvitationTemplate: React.FC<Readonly<InvitationTemplateProps>> = ({
  link,
}) => (
  <div>
    <h3>Welcome, to ChapGPT Clone!</h3>
    <p>
      Click on this link to join your team: <a href={link}>link</a>.
    </p>
  </div>
);
