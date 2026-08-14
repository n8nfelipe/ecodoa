import axios from "axios";

export interface IbgeUf {
  id: number;
  sigla: string;
  nome: string;
}

export interface IbgeCity {
  id: number;
  nome: string;
}

const ibge = axios.create({
  baseURL: "https://servicodados.ibge.gov.br/api/v1/localidades",
});

export async function fetchUfs(): Promise<IbgeUf[]> {
  const res = await ibge.get<IbgeUf[]>("/estados", {
    params: { orderBy: "nome" },
  });
  return res.data;
}

export async function fetchCities(uf: string): Promise<IbgeCity[]> {
  const res = await ibge.get<IbgeCity[]>(`/estados/${uf}/municipios`, {
    params: { orderBy: "nome" },
  });
  return res.data;
}