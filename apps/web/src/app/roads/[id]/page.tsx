import RoadDetailClient from "./RoadDetailClient";

// Generate static params for demo roads
export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
    { id: "6" },
    { id: "7" },
    { id: "8" },
  ];
}

export default function RoadDetailPage({ params }: { params: { id: string } }) {
  return <RoadDetailClient roadId={params.id} />;
}
