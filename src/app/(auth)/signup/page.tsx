
// "use client";

// // import Spinner from "@/components/shared/Spinner";
// import { useSignUpMutation } from "@/services/auth/authApi";
// import Image from "next/image";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import React, { useEffect, useState } from "react";
// import { toast } from "react-hot-toast";
// import { Eye, EyeOff, Spinner } from "lucide-react";

// const Signup = () => {
//   const router = useRouter();
//   const [avatarPreview, setAvatarPreview] = useState(null);
//   const [avatar, setAvatar] = useState(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [signup, { isLoading, data, error }] = useSignUpMutation();

//   useEffect(() => {
//     if (isLoading) {
//       toast.loading("Signing up...", { id: "signup" });
//     }

//     if (data) {
//       toast.success(data?.description, { id: "signup" });
      
//       // open new tab
//       setTimeout(() => {
//         router.push("/auth/signin");
//       }, 1000);
//     }
//     if (error?.data) {
//       toast.error(error?.data?.description, { id: "signup" });
//     }
//   }, [isLoading, data, error, router]);

//   const handleSignup = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();

//     formData.append("name", e.target.name.value);
//     formData.append("email", e.target.email.value);
//     formData.append("phone", e.target.phone.value);
//     formData.append("password", e.target.password.value);
//     signup(formData);

//     e.target.reset();
//     setAvatarPreview(null);
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   return (
//     <section className="min-w-full min-h-screen flex justify-center items-center p-4">
//       <div className="max-w-md w-full flex flex-col gap-y-4 border p-8 rounded-primary">
//         <div className="flex flex-row items-center gap-x-2">
//           <hr className="w-full" />
//           <Image
//             src="/logo.png"
//             alt="logo"
//             width={141}
//             height={40}
//             className="max-w-full cursor-pointer"
//             onClick={() => router.push("/")}
//           />
//           <hr className="w-full" />
//         </div>
//         <form
//           action=""
//           className="w-full flex flex-col gap-y-4"
//           onSubmit={handleSignup}
//         >
//           <label htmlFor="name" className="flex flex-col gap-y-1">
//             <span className="text-sm">Enter Your Name*</span>
//             <input
//               type="text"
//               name="name"
//               id="name"
//               placeholder="i.e. John Doe"
//               className=""
//               required
//             />
//           </label>
//           <label htmlFor="email" className="flex flex-col gap-y-1">
//             <span className="text-sm">Enter Your Email*</span>
//             <input
//               type="email"
//               name="email"
//               id="email"
//               placeholder="i.e. example@gmail.com"
//               className=""
//               required
//             />
//           </label>
//           <label htmlFor="password" className="flex flex-col gap-y-1 relative">
//             <span className="text-sm">Enter Your Password*</span>
//             <div className="relative">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 name="password"
//                 id="password"
//                 placeholder="i.e. Admin@123"
//                 className="w-full pr-10"
//                 required
//               />
//               <button
//                 type="button"
//                 onClick={togglePasswordVisibility}
//                 className="absolute right-2 top-1/2 transform -translate-y-1/2 focus:outline-none"
//                 aria-label={showPassword ? "Hide password" : "Show password"}
//               >
//                 {showPassword ? (
//                   <EyeOff className="h-5 w-5 text-gray-500" />
//                 ) : (
//                   <Eye className="h-5 w-5 text-gray-500" />
//                 )}
//               </button>
//             </div>
//           </label>
//           <label htmlFor="phone" className="flex flex-col gap-y-1">
//             <span className="text-sm">Enter Your Phone Number*</span>
//             <input
//               type="tel"
//               name="phone"
//               id="phone"
//               placeholder="i.e. +8801906315901"
//               className=""
//               required
//             />
//           </label>
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="py-2 border border-black rounded-secondary bg-black hover:bg-black/90 text-white transition-colors drop-shadow disabled:bg-gray-200 disabled:border-gray-200 disabled:text-black/50 disabled:cursor-not-allowed flex flex-row justify-center items-center text-sm"
//           >
//             {isLoading ? <Spinner /> : "Sign Up"}
//           </button>
//         </form>
//         <div className="flex flex-row justify-center items-center gap-x-2 text-xs">
//           <Link href="/auth/signin" className="">
//             Sign In
//           </Link>
//           <span className="h-4 border-l" />
//           <Link href="/auth/forgot-password" className="">
//             Forgot Password
//           </Link>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Signup;
