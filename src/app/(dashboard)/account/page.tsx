
// "use client";

// import Inform from "@/components/icons/Inform";
// import Trash from "@/components/icons/Trash";
// import Modal from "@/components/shared/Modal";
// import Dashboard from "@/components/shared/layouts/Dashboard";
// import {
//   useDeleteUserMutation,
//   useUpdateUserMutation,
// } from "@/services/user/userApi";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { getUser } from "src/lib/actions/auth.actions";
import Profile from "@components/shared/account/profile";

const Page = async () => {
  // const userInfo = useSelector((state) => state.auth.user);
  const user = await getUser();
 
  // const [updateUserInformation, { isLoading, data, error }] =
  //   useUpdateUserMutation();

  // useEffect(() => {
  //   setUser(userInfo);

  //   if (isLoading) {
  //     toast.loading("Updating user...", { id: "updateUserInformation" });
  //   }

  //   if (data) {
  //     toast.success(data?.description, { id: "updateUserInformation" });
  //   }

  //   if (error?.data) {
  //     toast.error(error?.data?.description, { id: "updateUserInformation" });
  //   }
  // }, [userInfo, isLoading, data, error]);



  return (
      <section className=" py-8">

        <Profile user={user} />
        {/* <DeleteUser /> */}
      </section>
  );
};

// function DeleteUser() {
//   const [isOpen, setIsOpen] = useState(false);
//   const user = await getUser();
//   const [deleteUser, { isLoading, data, error }] = useDeleteUserMutation();

//   useEffect(() => {
//     if (isLoading) {
//       toast.loading("Deleting User...", { id: "deleteUser" });
//     }

//     if (data) {
//       toast.success(data?.description, { id: "deleteUser" });
//     }

//     if (error) {
//       toast.error(error?.data?.description, { id: "deleteUser" });
//     }
//   }, [isLoading, data, error]);

//   return (
//     <>
//       <button
//         type="button"
//         className="py-2 border border-black rounded bg-red-900 hover:bg-red-900/90 text-white transition-colors drop-shadow cursor-pointer text-sm"
//         onClick={() => setIsOpen(true)}
//       >
//         Delete User
//       </button>

//       {isOpen && (
//         <Modal
//           isOpen={isOpen}
//           onClose={() => setIsOpen(false)}
//           className="p-4 lg:w-1/5"
//         >
//           <article className="flex flex-col gap-y-4">
//             <p className="text-xs bg-yellow-500/50 text-black px-2 py-0.5 rounded-sm text-center">
//               Account will be deleted permanently!
//             </p>
//             <div className="flex flex-col gap-y-2">
//               <h1 className="text-xl">Are you sure?</h1>
//               <p className="text-sm flex flex-col gap-y-2">
//                 You are about to lost following:
//                 <p className="flex flex-col gap-y-1.5">
//                   <span className="flex flex-row gap-x-1 items-center text-xs">
//                     <Inform /> {user?.cart?.length} products from cart
//                   </span>
//                   <span className="flex flex-row gap-x-1 items-center text-xs">
//                     <Inform /> {user?.favorites?.length} products from favorites
//                   </span>
//                   <span className="flex flex-row gap-x-1 items-center text-xs">
//                     <Inform /> {user?.purchases?.length} purchases records
//                   </span>
//                   <span className="flex flex-row gap-x-1 items-center text-xs">
//                     <Inform /> {user?.products?.length} products all time records
//                   </span>
//                 </p>
//               </p>
//             </div>
//             <div className="flex flex-row gap-x-4">
//               <button
//                 className="text-white bg-slate-500 px-3 py-1.5 rounded text-sm"
//                 onClick={() => setIsOpen(false)}
//               >
//                 No, cancel
//               </button>
//               <button
//                 className="flex flex-row gap-x-2 items-center text-white bg-red-500 px-3 py-1.5 rounded text-sm"
//                 onClick={() => deleteUser(user?._id)}
//               >
//                 <Trash /> Yes, delete
//               </button>
//             </div>
//           </article>
//         </Modal>
//       )}
//     </>
//   );
// }

export default Page;