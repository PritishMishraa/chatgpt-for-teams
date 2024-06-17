import * as React from "react";

interface CreditWarningTemplateProps {}

export const CreditWarningTemplate: React.FC<Readonly<CreditWarningTemplateProps>> = () => (
  <div>
    <h3>You have exhausted all the credits for the day!</h3>
    <p>
      More credits will be available tomorrow. 
    </p>
  </div>
);
