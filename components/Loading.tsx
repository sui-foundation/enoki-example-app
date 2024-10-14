import ScaleLoader from "react-spinners/ScaleLoader";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <ScaleLoader />
    </div>
  );
}
