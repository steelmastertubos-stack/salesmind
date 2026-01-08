import React from 'react';

export default function QuotePrintView({ quote, representative, onClose }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (quote.validity_days || 7));

  return (
    <div className="bg-white p-8 max-w-5xl mx-auto print:p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-2 border-black mb-4">
        <div className="flex items-start justify-between p-4 gap-4">
          {/* Logo e Dados do Representado */}
          <div className="flex-1">
            {quote.principal_logo_url && (
              <img 
                src={quote.principal_logo_url} 
                alt="Logo" 
                className="h-16 mb-2 object-contain"
              />
            )}
            <div className="text-sm space-y-0.5">
              <p className="font-bold text-base">{quote.principal_name}</p>
              <p>CNPJ: {quote.principal_cnpj}</p>
              {quote.principal_state_registration && (
                <p>I.E.: {quote.principal_state_registration}</p>
              )}
              {quote.principal_phone && (
                <p>Fone: {quote.principal_phone}</p>
              )}
            </div>
          </div>

          {/* Dados do Representante Comercial */}
          <div className="flex-1 border-2 border-black">
            <div className="bg-gray-100 border-b-2 border-black px-3 py-2">
              <p className="font-bold text-sm text-center">Representante Comercial</p>
            </div>
            {representative && (
              <div className="p-3 text-xs space-y-1">
                <p className="font-bold text-base mb-2">{representative.name}</p>
                {representative.document && (
                  <p><span className="font-semibold">CNPJ/CPF:</span> {representative.document}</p>
                )}
                {representative.phone && (
                  <p><span className="font-semibold">Telefone:</span> {representative.phone}</p>
                )}
                {representative.email && (
                  <p><span className="font-semibold">E-mail:</span> {representative.email}</p>
                )}
              </div>
            )}
          </div>

          {/* Caixa Orçamento */}
          <div className="border-2 border-black p-3 text-center min-w-[140px]">
            <p className="font-bold text-lg mb-1">ORÇAMENTO</p>
            <p className="text-sm">Nº. {quote.quote_number}</p>
            <p className="text-sm">{formatDate(quote.created_date || new Date())}</p>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-200 border-b-2 border-black px-2 py-1">
          <p className="font-bold text-center">Cliente</p>
        </div>
        <div className="p-2 text-sm space-y-0.5">
          <p><strong>Cliente:</strong> {quote.client_name}</p>
          <p>
            <strong>Endereço:</strong> {quote.client_address} - {quote.client_city}/{quote.client_state}
          </p>
          <p>
            <strong>CNPJ:</strong> {quote.client_cnpj}
            {quote.client_state_registration && (
              <span className="ml-4"><strong>I.E.:</strong> {quote.client_state_registration}</span>
            )}
          </p>
          {quote.client_phone && (
            <p><strong>Telefone:</strong> {quote.client_phone}</p>
          )}
          {quote.client_contact && (
            <p><strong>Contato:</strong> {quote.client_contact}</p>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-200 border-b-2 border-black px-2 py-1">
          <p className="font-bold text-center">Itens</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100">
              <th className="border-r border-black p-1 text-left">Item</th>
              <th className="border-r border-black p-1 text-left">Qtde</th>
              <th className="border-r border-black p-1 text-left">Unid</th>
              <th className="border-r border-black p-1 text-left">Produto</th>
              <th className="border-r border-black p-1 text-left">NCM</th>
              <th className="border-r border-black p-1 text-right">Preço Unit</th>
              <th className="border-r border-black p-1 text-right">ICMS</th>
              <th className="border-r border-black p-1 text-right">IPI</th>
              <th className="border-r border-black p-1 text-right">Valor Total</th>
              <th className="p-1 text-right">Entrega*</th>
            </tr>
          </thead>
          <tbody>
            {quote.items?.map((item, index) => (
              <tr key={index} className="border-b border-black">
                <td className="border-r border-black p-1 text-center">{index + 1}</td>
                <td className="border-r border-black p-1 text-right">
                  {item.quantity.toFixed(3)}
                </td>
                <td className="border-r border-black p-1 text-center">{item.unit.toUpperCase()}</td>
                <td className="border-r border-black p-1">
                  {item.product_code} - {item.product_name}
                  {item.description && (
                    <div className="text-[10px] text-gray-600">{item.description}</div>
                  )}
                </td>
                <td className="border-r border-black p-1">{item.ncm}</td>
                <td className="border-r border-black p-1 text-right">
                  {formatCurrency(item.price_per_kg)}
                </td>
                <td className="border-r border-black p-1 text-right">{item.icms_rate.toFixed(2)}</td>
                <td className="border-r border-black p-1 text-right">{item.ipi_rate.toFixed(2)}</td>
                <td className="border-r border-black p-1 text-right">
                  {formatCurrency(item.item_total)}
                </td>
                <td className="p-1 text-center">
                  {item.delivery_days > 0 ? `${item.delivery_days} DIA(S)` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Valores */}
      <div className="border-2 border-black mb-4 p-2">
        <div className="text-sm text-right space-y-1">
          <p>
            <strong>Valor Total Produtos:</strong>{' '}
            <span className="inline-block w-32">{formatCurrency(quote.products_subtotal)}</span>
          </p>
          <p>
            <strong>Valor ICMS ST:</strong>{' '}
            <span className="inline-block w-32">{formatCurrency(0)}</span>
          </p>
          <p>
            <strong>Valor Total do IPI:</strong>{' '}
            <span className="inline-block w-32">{formatCurrency(quote.total_ipi)}</span>
          </p>
          {quote.freight_value > 0 && (
            <p>
              <strong>Valor Frete:</strong>{' '}
              <span className="inline-block w-32">{formatCurrency(quote.freight_value)}</span>
            </p>
          )}
          <p className="text-base pt-1 border-t border-black">
            <strong>Valor Total da Proposta:</strong>{' '}
            <span className="inline-block w-32">{formatCurrency(quote.total_value)}</span>
          </p>
        </div>
      </div>

      {/* Rodapé com Condições e Observações */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Condições Gerais */}
        <div className="border-2 border-black">
          <div className="bg-gray-200 border-b-2 border-black px-2 py-1">
            <p className="font-bold text-center">Condições Gerais</p>
          </div>
          <div className="p-2 text-xs space-y-1">
            <p><strong>Data de Validade:</strong> {formatDate(validityDate)}</p>
            {quote.payment_terms && (
              <p><strong>Condição de Pagamento:</strong> {quote.payment_terms}</p>
            )}
            <p><strong>Finalidade da Venda:</strong> Industrialização</p>
            <p><strong>Contribuinte:</strong> SIM</p>
            <p><strong>Modalidade do Frete:</strong> {quote.freight_type || 'FOB'}</p>
            {quote.client_address && (
              <p>
                <strong>Local de Entrega:</strong> {quote.client_address} - {quote.client_city}/{quote.client_state}
              </p>
            )}
            <p><strong>Transportadora:</strong> -</p>
          </div>
        </div>

        {/* Observações */}
        <div className="border-2 border-black">
          <div className="bg-gray-200 border-b-2 border-black px-2 py-1">
            <p className="font-bold text-center">Observações</p>
          </div>
          <div className="p-2 text-xs space-y-1">
            <p>Prazo de Entrega contados em Dias Úteis após aprovação do Orçamento.</p>
            <p>Descarga dos materiais por conta do cliente.</p>
            <p>Liberação de faturamento mediante a análise e aprovação do setor de crédito. Análise é feita somente após confirmação do pedido.</p>
            {quote.notes && (
              <p className="mt-2 pt-2 border-t border-black">{quote.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Vendedor e Emitente */}
      {representative && (
        <div className="text-xs space-y-1">
          <p>
            <strong>Vendedor:</strong> {representative.document} - {representative.name}
          </p>
          {representative.email && (
            <p><strong>E-mail:</strong> {representative.email}</p>
          )}
          {representative.department && (
            <p>
              <strong>Emitente:</strong> {representative.department}
            </p>
          )}
        </div>
      )}

      {/* Linha De acordo */}
      <div className="mt-8 pt-8 border-t-2 border-black">
        <p className="text-center text-sm"><strong>De acordo</strong></p>
        {representative?.signature_image_url && (
          <div className="mt-4 flex justify-center">
            <img 
              src={representative.signature_image_url} 
              alt="Assinatura" 
              className="h-16 object-contain"
            />
          </div>
        )}
      </div>

      {/* Close Button (not for print) */}
      <div className="mt-6 text-center print:hidden">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 mr-2"
        >
          Fechar
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4a6f]"
        >
          Imprimir
        </button>
      </div>

      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}