import React from "react";
import Container from "@components/shared/Container";
import { getUser } from "src/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { formatDate, formatNaira } from "src/lib/utils";
import FavouriteActions from "src/app/(dashboard)/account/favourites/favourite-actions";
import { Separator } from "@components/ui/separator";
import { X } from "lucide-react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";

const Favourites = async () => {
  const session = await getUser();
  if (!session?.data) {
    redirect("/login?callbackUrl=/customer/favourites");
  }

  return (
    <main>
      <Container className="py-6">
        <h1 className="h2-bold">
          Favourites ({session.data.favorites.length})
        </h1>
        <Separator className="mt-2 mb-8" />

        {session.data.favorites.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[600px]">
              <TableHeader className="bg-white px-6 py-4 text-black">
                <TableRow>
                  <TableHead className="rounded-l-lg"></TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="rounded-r-lg text-center">
                    Add to Cart
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.data.favorites.map((product: any) => (
                  <TableRow key={product.product._id} className="">
                    <TableCell>
                      <button className="text-black">
                        <X />
                      </button>
                    </TableCell>
                    <TableCell>
                      <Image
                        src={product.product.thumbnail.url}
                        width={100}
                        height={100}
                        alt={product.product.title}
                        className="rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell>{product.product.title}</TableCell>
                    <TableCell>{formatNaira(product.product.price)}</TableCell>
                    <TableCell>
                      {formatDate(product.product.createdAt)}
                    </TableCell>
                    <TableCell className="flex items-center justify-center !min-h-full">
                      <FavouriteActions />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-4">No favourites yet.</p>
        )}
      </Container>
    </main>
  );
};

export default Favourites;
