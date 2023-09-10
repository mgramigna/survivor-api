export type ApiResponse<T> = Promise<
  { ok: false; error: string } | { ok: true; data: T }
>;

export type CastawayReadResponse = {
  id: number;
  name: string;
  seasons: { name: string | null; number: number }[];
};

export type CastawaySearchResponse = CastawayReadResponse[];
