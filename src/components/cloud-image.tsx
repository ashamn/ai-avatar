import React from "react";
import { ImSpinner8 } from "react-icons/im";
import { X } from "lucide-react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";

interface Props {
  s3Key: string;
  url: string;
}

function CloudImage({ s3Key, url }: Props) {
  const utils = api.useContext();

  const deleteImageFromS3 = api.storage.removeImageFromS3.useMutation({
    onSuccess: () => {
      toast.success("image delete from cloud");
      utils.storage.getAllUserUploadedImages.invalidate();
    },
  });

  return (
    <div className="relative m-4 h-[256px] w-[256px]">
      {deleteImageFromS3.isLoading && (
        <div className="absolute inset-0 flex w-full items-center justify-center bg-black/40">
          <ImSpinner8 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}
      <button
        onClick={() => {
          deleteImageFromS3.mutate({ key: s3Key });
        }}
        className="absolute top-0 right-0 mt-1 mr-1 rounded-xl bg-black/30 p-2 text-white"
      >
        <X className="h-5 w-5" />
      </button>
      <img src={url} alt={""} className="h-full w-full object-cover"></img>
    </div>
  );
}

export default CloudImage;
