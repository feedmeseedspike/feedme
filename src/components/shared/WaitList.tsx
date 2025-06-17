import React from "react";

const Waitlist = () => {
  return (
    <section>
        <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center my-12">
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-semibold">Join The FeedMe Community</h1>
            <p className="text-sm">
              Sign up and be the first to learn about updates from FeedMe
            </p>
          </div>
          <div className="relative w-full md:w-[28rem]">
            <input
              className="p-5 rounded-[8px] w-full border border-[#D0D5DD] placeholder:text-xs sm:placeholder:text-sm"
              placeholder="Enter your email address..."
            />
            <button className="text-white bg-[#1B6013] rounded-[8px] px-3 sm:px-[20px] py-3 absolute right-3 top-1/2 transform -translate-y-1/2 text-xs lg:text-[16px]">
              Join Our Community
            </button>
          </div>
        </div>
    </section>
  );
};

export default Waitlist;
