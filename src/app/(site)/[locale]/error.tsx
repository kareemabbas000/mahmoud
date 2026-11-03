"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const ar = typeof document !== "undefined" && document.documentElement.lang === "ar";
  return (
    <section className="container-x grid min-h-[50vh] place-items-center py-24 text-center">
      <div>
        <p className="wp-ref">ERR·500</p>
        <h1 className="display d-2 mt-3">{ar ? "حدث خطأ غير متوقع" : "Something went wrong"}</h1>
        <button type="button" onClick={reset} className="btn btn-primary mt-8">{ar ? "إعادة المحاولة" : "Try again"}</button>
      </div>
    </section>
  );
}
