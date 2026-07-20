import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { legalStyles as s } from "@/components/legal/legal-styles";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.terms");
  return { title: t("pageTitle") };
}

const PENALTY_ROWS = [
  { count: 3, level: 1 },
  { count: 6, level: 2 },
  { count: 9, level: 3 },
  { count: 12, level: 4 },
  { count: 15, level: 5 },
  { count: 18, level: 6 },
  { count: 21, level: 7 },
] as const;

export default async function TermsPage() {
  const t = await getTranslations("Legal.terms");
  const restrictions = t.raw("section4.table.restrictions") as string[];

  return (
    <LegalPageShell title={t("pageTitle")} lastUpdated={t("lastUpdated")}>
      <p className={s.p} style={{ marginTop: "20px" }}>
        {t("introBefore")}{" "}
        <Link href="/privacy" className={s.a}>
          {t("introPrivacyLink")}
        </Link>{" "}
        {t("introAfter")}
      </p>

      <h2 className={s.h2}>{t("section1.heading")}</h2>
      <p className={s.p}>{t("section1.body")}</p>
      <div className={s.callout}>
        <p className={s.calloutText}>
          <strong>{t("section1.calloutBold")}</strong> {t("section1.calloutRest")}
        </p>
      </div>

      <h2 className={s.h2}>{t("section2.heading")}</h2>
      <p className={s.p}>{t("section2.body")}</p>
      <ul className={s.ul}>
        <li>
          {t("section2.li1Prefix")} <strong>{t("section2.li1Bold")}</strong>{" "}
          {t("section2.li1Mid")} <code>@</code>
          {t("section2.li1Suffix")}
        </li>
        <li>{t("section2.li2")}</li>
        <li>{t("section2.li3")}</li>
        <li>{t("section2.li4")}</li>
      </ul>

      <h3 className={s.h3}>{t("section2.sub1Heading")}</h3>
      <p className={s.p}>{t("section2.sub1Body1")}</p>
      <p className={s.p}>{t("section2.sub1Body2")}</p>

      <h2 className={s.h2}>{t("section3.heading")}</h2>
      <p className={s.p}>{t("section3.intro")}</p>
      <ul className={s.ul}>
        <li>{t("section3.li1")}</li>
        <li>{t("section3.li2")}</li>
        <li>{t("section3.li3")}</li>
      </ul>
      <p className={s.p}>{t("section3.body2")}</p>

      <h3 className={s.h3}>{t("section3.sub1Heading")}</h3>
      <p className={s.p}>
        {t("section3.sub1BodyBefore")}{" "}
        <strong>{t("section3.sub1BodyBold")}</strong> {t("section3.sub1BodyAfter")}
      </p>

      <h2 className={s.h2}>{t("section4.heading")}</h2>
      <p className={s.p}>{t("section4.body")}</p>

      <h3 className={s.h3}>{t("section4.sub1Heading")}</h3>
      <p className={s.p}>{t("section4.sub1Body1")}</p>
      <p className={s.p}>{t("section4.sub1Body2")}</p>

      <h3 className={s.h3}>{t("section4.sub2Heading")}</h3>
      <p className={s.p}>{t("section4.sub2Body1")}</p>
      <p className={s.p}>{t("section4.sub2Body2")}</p>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.th}>{t("section4.table.colCount")}</th>
            <th className={s.th}>{t("section4.table.colLevel")}</th>
            <th className={s.th}>{t("section4.table.colRestriction")}</th>
          </tr>
        </thead>
        <tbody>
          {PENALTY_ROWS.map(({ count, level }, i) => (
            <tr key={level}>
              <td className={s.td}>{count}</td>
              <td className={s.td}>{level}</td>
              <td className={s.td}>{restrictions[i]}</td>
            </tr>
          ))}
          <tr>
            <td className={s.td}>24</td>
            <td className={s.td}>8</td>
            <td className={s.td}>
              <strong>{t("section4.table.row8RestrictionBold")}</strong>
              {t("section4.table.row8RestrictionRest")}
            </td>
          </tr>
        </tbody>
      </table>
      <p className={s.p}>{t("section4.sub2Body3")}</p>
      <p className={s.p}>{t("section4.sub2Body4")}</p>

      <h2 className={s.h2}>{t("section5.heading")}</h2>
      <p className={s.p}>{t("section5.body1")}</p>
      <p className={s.p}>{t("section5.body2")}</p>

      <h2 className={s.h2}>{t("section6.heading")}</h2>
      <p className={s.p}>{t("section6.body")}</p>

      <h2 id="privacidad" className={s.h2}>
        {t("section7.heading")}
      </h2>
      <p className={s.p}>{t("section7.body1")}</p>
      <p className={s.p}>{t("section7.rightsIntro")}</p>
      <ul className={s.ul}>
        <li>
          <strong>{t("section7.li1Bold")}</strong> {t("section7.li1Rest")}
        </li>
        <li>
          <strong>{t("section7.li2Bold")}</strong> {t("section7.li2Rest")}
        </li>
        <li>
          <strong>{t("section7.li3Bold")}</strong> {t("section7.li3Rest")}
        </li>
      </ul>
      <p className={s.p}>
        {t("section7.body2Before")}{" "}
        <Link href="/privacy" className={s.a}>
          {t("section7.body2PrivacyLink")}
        </Link>
        .
      </p>

      <h2 className={s.h2}>{t("section8.heading")}</h2>
      <p className={s.p}>{t("section8.body")}</p>

      <h2 className={s.h2}>{t("section9.heading")}</h2>
      <p className={s.p}>{t("section9.body")}</p>

      <h2 className={s.h2}>{t("section10.heading")}</h2>
      <p className={s.p}>{t("section10.body")}</p>

      <h2 className={s.h2}>{t("section11.heading")}</h2>
      <p className={s.p}>{t("section11.body")}</p>

      <h2 className={s.h2}>{t("section12.heading")}</h2>
      <p className={s.p}>
        {t("section12.before")}{" "}
        <a href="mailto:legal@vinlyst.app" className={s.a}>
          legal@vinlyst.app
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
