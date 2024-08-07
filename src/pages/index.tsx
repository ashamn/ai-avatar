import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { signIn, signOut, useSession } from "next-auth/react";
import { ChevronRight } from "lucide-react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";

export default function Homepage() {
  const { status, data } = useSession();
  const [email, setEmail] = useState("");
  const router = useRouter();

  const checkout = api.stripe.checkout.useMutation({
    onError: (error) => {
      console.log(checkout);
      toast.error(error.message);
    },
    onSuccess: (data) => {
      console.log(data);
      if (data.checkoutUrl) router.push(data.checkoutUrl);
    },
  });

  const search = useSearchParams();
  const success = search.get("success");
  const cancelled = search.get("cancelled");

  useEffect(() => {
    if (success) {
      toast.success(
        "Payment succeeded! You will receive an email confirmation"
      );
    }
  }, [success]);

  useEffect(() => {
    if (cancelled) {
      toast.success("Payment cancelled");
    }
  }, [cancelled]);

  const paymentStatus = api.stripe.getPaymentStatus.useQuery();

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-pink-200 via-white to-sky-300"></div>
      <div className="container mx-auto">
        <header className="flex w-full max-w-screen-xl justify-between bg-transparent px-10 py-4">
          <div>
            {/* logo */}
            AI Avatar
          </div>
          <div>
            {/* This is for the menu */}{" "}
            {status === "authenticated" && (
              <Button onClick={() => signOut()}>Logout</Button>
            )}
          </div>
        </header>
        <div className="m-10 flex flex-col items-center justify-center">
          <div className="bg-gradient-to-br from-black via-slate-600 to-black bg-clip-text text-center text-6xl font-semibold leading-snug text-transparent">
            <p>Create your own</p>
            <p>
              photorealistic <span className="text-[#3290EE]">AI</span> Avatars
            </p>
          </div>
          <div className="my-12 w-full max-w-2xl">
            {status === "unauthenticated" && (
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={() => console.log("open authentication")}
                    className="transision w-full transform rounded-full bg-gradient-to-tr from-sky-400 via-lime-300 to-yellow-400 p-1 duration-200 active:scale-95"
                  >
                    <span className="block rounded-full bg-white py-2 tracking-widest">
                      Create your avatar now
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Complete authentication</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      console.log(email, "signing in");
                      signIn("email", { email });
                    }}
                    className="flex flex-col space-y-4"
                  >
                    <Input
                      type="email"
                      required
                      placeholder="john@doe.com"
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                    />
                    <Button type="submit" className="w-full">
                      Verify your email
                    </Button>
                  </form>
                  <p className="w-full text-center font-bold">OR</p>
                  <Button onClick={() => signIn("google")}>
                    <FaGoogle className="mr-2" />
                    Sign in with Google
                  </Button>
                </DialogContent>
              </Dialog>
            )}
            <div className="relative w-full justify-center">
              {status === "authenticated" && (
                <Button
                  className="group w-full"
                  onClick={() => {
                    paymentStatus.data?.isPaymentSucceeded
                      ? router.push("dashboard")
                      : checkout.mutate();
                  }}
                >
                  {paymentStatus.data?.isPaymentSucceeded
                    ? "Go to your dashboard"
                    : "Checkout"}
                  <ChevronRight className="ml-2 transition group-hover:translate-x-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
