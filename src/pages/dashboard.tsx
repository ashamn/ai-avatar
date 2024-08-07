import Layout from "@/components/layout";
import React, { useState } from "react";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { ImSpinner8 } from "react-icons/im";
import Dropzone from "@/components/dropzone";
import { X } from "lucide-react";
import CloudImage from "@/components/cloud-image";
import { Button } from "@/components/ui/button";

function Dashboard() {
  const router = useRouter();
  const [uploadMoreImages, setUploadMoreImages] = useState(false);

  const checkModelTrainingStatus =
    api.replicate.checkModelTrainingStatus.useQuery(undefined, {
      onSuccess: (data) => {
        if (data) {
          toast(
            "model training already started, redirecting you to generate avatars page"
          );
          router.push("/generate-avatars");
        }
      },
    });

  const startTrainingModel = api.replicate.startTrainingModel.useMutation({
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: (data) => {
      toast.success("model training started successfully");
      router.push("/generate-avatars");
    },
  });

  const getAllUserUploadedImages =
    api.storage.getAllUserUploadedImages.useQuery();

  const paymentStatus = api.stripe.getPaymentStatus.useQuery(undefined, {
    onError: (err) => {
      if (err.data?.httpStatus === 401) {
        router.push("/");
        toast.error("Please login first");
      }
    },
    onSuccess: (data) => {
      if (!data?.isPaymentSucceeded) {
        toast.error("Please complete te payment first");
        router.push("/");
      }
    },
  });
  console.log("paymentStatus :>> ", paymentStatus.isLoading);

  if (
    paymentStatus.isLoading ||
    !paymentStatus.data?.isPaymentSucceeded ||
    getAllUserUploadedImages.isLoading
  ) {
    return (
      <Layout>
        <div className="flex h-[88vh] w-full items-center justify-center">
          <ImSpinner8 className="h-10 w-10 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {getAllUserUploadedImages.data?.uploadedImagesWithKey && (
        <>
          <div className="flex flex-wrap items-center justify-center">
            {getAllUserUploadedImages.isSuccess &&
              (getAllUserUploadedImages.data?.uploadedImagesWithKey || []).map(
                (imageObj, indx) => {
                  if (imageObj.key && imageObj.url)
                    return (
                      <CloudImage
                        key={imageObj.key}
                        s3Key={imageObj.key}
                        url={imageObj.url}
                      />
                    );
                }
              )}
          </div>
          <div className=" flex w-full items-center justify-center space-x-4 bg-black/50 p-10">
            <div>
              <Button
                disabled={startTrainingModel.isLoading}
                onClick={() => setUploadMoreImages(true)}
              >
                Upload More Images
              </Button>
            </div>
            <div>
              <Button
                onClick={() => {
                  startTrainingModel.mutate();
                }}
                disabled={startTrainingModel.isLoading}
              >
                Start Training Your Model
              </Button>
            </div>
          </div>
        </>
      )}

      {(!getAllUserUploadedImages.data?.uploadedImagesWithKey?.length ||
        uploadMoreImages) && <Dropzone />}
    </Layout>
  );
}

export default Dashboard;
