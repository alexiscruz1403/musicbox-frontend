import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { legalStyles as s } from "@/components/legal/legal-styles";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.privacy");
  return { title: t("pageTitle") };
}

interface DataRow {
  data: string;
  origin: string;
  required: string;
}

interface ProviderRow {
  provider: string;
  receives: string;
  purpose: string;
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal.privacy");
  const dataRows = t.raw("section2.table.rows") as DataRow[];
  const providerRows = t.raw("section5.table.rows") as ProviderRow[];

  return (
    <LegalPageShell title={t("pageTitle")} lastUpdated={t("lastUpdated")}>
      <p className={s.p} style={{ marginTop: "20px" }}>
        {t("introBefore")}{" "}
        <Link href="/terms" className={s.a}>
          {t("introTermsLink")}
        </Link>
        {t("introAfter")}
      </p>

      <h2 className={s.h2}>{t("section1.heading")}</h2>
      <p className={s.p}>
        {t("section1.before")}{" "}
        <a href="mailto:privacidad@vinlyst.app" className={s.a}>
          privacidad@vinlyst.app
        </a>
        .
      </p>

      <h2 className={s.h2}>{t("section2.heading")}</h2>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.th}>{t("section2.table.colData")}</th>
            <th className={s.th}>{t("section2.table.colOrigin")}</th>
            <th className={s.th}>{t("section2.table.colRequired")}</th>
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row) => (
            <tr key={row.data}>
              <td className={s.td}>{row.data}</td>
              <td className={s.td}>{row.origin}</td>
              <td className={s.td}>{row.required}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.p}>{t("section2.body")}</p>

      <h2 className={s.h2}>{t("section3.heading")}</h2>
      <ul className={s.ul}>
        <li>{t("section3.li1")}</li>
        <li>{t("section3.li2")}</li>
        <li>{t("section3.li3")}</li>
        <li>{t("section3.li4")}</li>
        <li>{t("section3.li5")}</li>
        <li>{t("section3.li6")}</li>
        <li>{t("section3.li7")}</li>
        <li>{t("section3.li8")}</li>
      </ul>

      <h2 className={s.h2}>{t("section4.heading")}</h2>
      <p className={s.p}>{t("section4.body")}</p>

      <h2 className={s.h2}>{t("section5.heading")}</h2>
      <p className={s.p}>{t("section5.intro")}</p>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.th}>{t("section5.table.colProvider")}</th>
            <th className={s.th}>{t("section5.table.colReceives")}</th>
            <th className={s.th}>{t("section5.table.colPurpose")}</th>
          </tr>
        </thead>
        <tbody>
          {providerRows.map((row) => (
            <tr key={row.provider}>
              <td className={s.td}>{row.provider}</td>
              <td className={s.td}>{row.receives}</td>
              <td className={s.td}>{row.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={s.callout}>
        <p className={s.calloutText}>{t("section5.callout")}</p>
      </div>

      <h2 className={s.h2}>{t("section6.heading")}</h2>
      <ul className={s.ul}>
        <li>{t("section6.li1")}</li>
        <li>{t("section6.li2")}</li>
        <li>{t("section6.li3")}</li>
        <li>{t("section6.li4")}</li>
      </ul>
      <p className={s.p}>{t("section6.body")}</p>

      <h2 className={s.h2}>{t("section7.heading")}</h2>
      <p className={s.p}>{t("section7.body")}</p>

      <h2 className={s.h2}>{t("section8.heading")}</h2>
      <p className={s.p}>
        {t("section8.intro")}{" "}
        <a href="mailto:privacidad@vinlyst.app" className={s.a}>
          privacidad@vinlyst.app
        </a>
        :
      </p>
      <ul className={s.ul}>
        <li>
          <strong>{t("section8.li1Bold")}</strong> {t("section8.li1Rest")}
        </li>
        <li>
          <strong>{t("section8.li2Bold")}</strong> {t("section8.li2Rest")}
        </li>
        <li>
          <strong>{t("section8.li3Bold")}</strong> {t("section8.li3Rest")}
        </li>
      </ul>

      <h3 className={s.h3}>{t("section8.sub1Heading")}</h3>
      <p className={s.p}>{t("section8.sub1Body1")}</p>
      <p className={s.p}>{t("section8.sub1Body2")}</p>

      <h2 className={s.h2}>{t("section9.heading")}</h2>
      <p className={s.p}>{t("section9.body")}</p>

      <h2 className={s.h2}>{t("section10.heading")}</h2>
      <p className={s.p}>{t("section10.body")}</p>

      <h2 className={s.h2}>{t("section11.heading")}</h2>
      <p className={s.p}>{t("section11.body")}</p>

      <h2 className={s.h2}>{t("section12.heading")}</h2>
      <p className={s.p}>{t("section12.body")}</p>

      <h2 className={s.h2}>{t("section13.heading")}</h2>
      <p className={s.p}>{t("section13.body")}</p>

      <h2 className={s.h2}>{t("section14.heading")}</h2>
      <p className={s.p}>
        {t("section14.body")}{" "}
        <a href="mailto:privacidad@vinlyst.app" className={s.a}>
          privacidad@vinlyst.app
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
