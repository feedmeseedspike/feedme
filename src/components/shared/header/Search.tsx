import React from "react";
import Searchs from "@components/icons/search.svg"
import Filter from "@components/icons/filter.svg"

const Search = () => {
  return (
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Searchs className="text-black size-[20px]" />
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Filter className="text-black size-[20px]" />
          </span>
          <input
            type="text"
            className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-blue-300"
            placeholder="Fruits, vegetables, pepper, etc"
          />
        </div>
    // <div className="">
    //   <div className="hidden mx-10 md:block">
    //   </div>
    //   {/* <div className="my-4 md:hidden">
    //     <div className="relative">
    //       <span className="absolute inset-y-0 left-0 flex items-center pl-3">
    //         <svg
    //           className="w-5 h-5 text-gray-400"
    //           viewBox="0 0 24 24"
    //           fill="none"
    //         >
    //           <path
    //             d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
    //             stroke="currentColor"
    //             stroke-width="2"
    //             stroke-linecap="round"
    //             stroke-linejoin="round"
    //           ></path>
    //         </svg>
    //       </span>

    //       <input
    //         type="text"
    //         className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-blue-300"
    //         placeholder="Search"
    //       />
    //     </div>
    //   </div> */}
    // </div>
  );
};

export default Search;
