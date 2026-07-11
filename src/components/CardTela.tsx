type Props = {
  tipo: string;
  preco: number;
  maoDeObra: number;
};

export default function CardTela({
  tipo,
  preco,
  maoDeObra,
}: Props) {

  return (
    <div className="border rounded-xl p-5 flex justify-between items-center mt-4">

      <div>
        <h2 className="font-bold text-xl">
          Tela {tipo}
        </h2>

        <p className="text-gray-500">
          Peça: R$ {preco},00
        </p>
      </div>

      <div className="text-green-600 font-bold text-2xl">
        R$ {preco + maoDeObra},00
      </div>

    </div>
  );
}