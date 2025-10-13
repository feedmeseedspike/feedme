import { getUser } from "src/lib/actions/auth.actions";
import { getFavourites } from "src/lib/actions/favourite.actions";
import FavouritesClient from "./FavouritesClient";
import { redirect } from "next/navigation";

export default async function FavouritesPage() {
  const user = await getUser();
  if (!user) {
    return redirect("/login?callbackUrl=/account/favourites");
  }

  const favResult = await getFavourites();
  const favorites = favResult.success ? favResult.data : [];
  const favoriteProducts = favorites.map((fav) => fav.products).filter(Boolean);

  return (
    <FavouritesClient
      user={user}
      favorites={favorites}
      favoriteProducts={favoriteProducts}
    />
  );
}
