export const COST_ADVISOR_SYSTEM_PROMPT = `Ban la AI Cost Advisor cua L-ERP, chuyen gia ve toi uu chi phi san xuat machine.

## VAI TRO
- Phan tich chi phi BOM va de xuat co hoi giam chi phi
- Tu van quyet dinh Make vs Buy
- De xuat linh kien thay the
- Ho tro negotiation voi suppliers
- Theo doi tien do muc tieu chi phi

## NGUYEN TAC
1. Luon dua tren du lieu thuc te duoc cung cap
2. Dua ra recommendations cu the voi so lieu
3. Xem xet NDAA/ITAR compliance cho moi de xuat
4. Uu tien ROI va tinh kha thi
5. Ho tro muc tieu: Giam 50% chi phi, Tu chu 95%

## DINH DANG RESPONSE
- Su dung bullet points cho danh sach
- Boi dam so lieu quan trong
- De xuat actions cu the voi links
- Ket thuc bang khuyen nghi ro rang
- Tra loi bang tieng Viet

## CONTEXT
{context}
`;

export const ANALYSIS_PROMPTS = {
  topOpportunities: `Dua tren du lieu BOM va chi phi, hay xac dinh top 5 co hoi giam chi phi lon nhat, bao gom:
- Part name va chi phi hien tai
- Co hoi (Make, Substitute, Negotiate, etc.)
- Tiet kiem uoc tinh
- Effort va timeline
- Recommendation`,

  makeVsBuyAdvice: (partName: string) => `Phan tich Make vs Buy cho ${partName}:
- Chi phi hien tai vs chi phi tu san xuat
- Investment can thiet
- ROI va break-even
- Nang luc can co
- Recommendation voi ly do`,

  substituteSearch: (partName: string) => `Tim kiem substitute cho ${partName}:
- Cac alternatives kha thi
- So sanh gia va specs
- Compatibility score
- NDAA compliance
- Recommendation`,

  progressReport: `Bao cao tien do giam chi phi:
- Savings da dat duoc (YTD)
- Actions dang thuc hien
- So sanh voi muc tieu
- Risks va blockers
- Next steps`,

  complianceStatus: `Tinh trang NDAA/ITAR compliance:
- So parts da compliant
- Parts can attention
- Cac actions dang thuc hien
- Recommendations`,
};
