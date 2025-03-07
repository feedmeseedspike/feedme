import React, { useTransition, useMemo, useState } from "react";
import Container from "@components/shared/Container";
import { useDispatch, useSelector } from "react-redux";
import { products } from "src/lib/data";
import { RootState } from "src/store";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import Image from "next/image";
import { getUser } from "src/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { formatNaira } from "src/lib/utils";
import { Trash2 } from "lucide-react";
import FavouriteActions from "src/app/(home)/customer/favourites/favourite-actions";
import { Separator } from "@components/ui/separator";

const Favourites = async () => {
  const session = await getUser();
  if (!session?.data) {
    redirect("/login?callbackUrl=/customer/favourites");
  }

  // console.log(session.data.favorites[0].product)

  return (
    <main>
      <Container className="py-6">
        <h1 className="h2-bold">
          Favourites ({session.data.favorites.length})
        </h1>
        <Separator className="mt-2 mb-8" />

        {session.data.favorites.length > 0 ? (
          <Table>
            <TableCaption>Your favorite products</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="text-md md:text-xl font-semibold flex flex-1">
                  Products
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {session.data.favorites.map((product: any) => {
                console.log(product);
                return (
                  <TableRow key={product.product._id}>
                    <TableCell>
                      <Image
                        src={product.product.thumbnail.url}
                        width={100}
                        height={100}
                        alt={product.product.title}
                      />
                    </TableCell>
                    <TableCell>{product.product.title}</TableCell>
                    <TableCell>{formatNaira(product.product.price)}</TableCell>
                    <TableCell className="w-auto p-0">
                      <FavouriteActions />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500 mt-4">No favourites yet.</p>
        )}
      </Container>
    </main>
  );
};

export default Favourites;
