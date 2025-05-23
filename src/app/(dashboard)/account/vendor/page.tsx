import VendorProfile from "@components/shared/account/vendor";
import React from "react";
import { vendor, vendors } from "src/lib/data";

const page = () => {
  return (
    <div>
      {" "}
      <VendorProfile vendor={vendor} />
    </div>
  );
};

export default page;
