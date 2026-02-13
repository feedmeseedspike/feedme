import { getSpinPrizes, getProductsList } from "@/lib/actions/prize.actions";
import PrizesClient from "./PrizesClient";

export const dynamic = "force-dynamic";

export default async function PrizesPage() {
  const prizes = await getSpinPrizes();
  const products = await getProductsList();
  
  return (
    <div className="p-6">
       <PrizesClient initialPrizes={prizes} productsList={products} />
    </div>
  );
}
