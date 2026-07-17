import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { legalStyles as s } from "@/components/legal/legal-styles";

export const metadata = {
  title: "Política de Privacidad — Vinlyst",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Política de Privacidad de Vinlyst"
      lastUpdated="Última actualización: 10 de julio de 2026 · Vigente desde su publicación"
    >
      <p className={s.p} style={{ marginTop: "20px" }}>
        Esta Política de Privacidad describe qué datos personales recolecta Vinlyst, con qué
        finalidad los trata, con quién los compartimos y qué derechos tenés sobre ellos, conforme
        a la Ley N.º 25.326 de Protección de Datos Personales de la República Argentina. Se
        complementa con nuestros{" "}
        <Link href="/terms" className={s.a}>
          Términos y Condiciones
        </Link>
        , que también aceptás al usar el Servicio.
      </p>

      <h2 className={s.h2}>1. Responsable del tratamiento</h2>
      <p className={s.p}>
        Vinlyst es responsable del tratamiento de los datos personales que recolecta a través de
        la aplicación web. Ante cualquier consulta sobre esta política o para ejercer tus
        derechos, podés escribirnos a{" "}
        <a href="mailto:privacidad@vinlyst.app" className={s.a}>
          privacidad@vinlyst.app
        </a>
        .
      </p>

      <h2 className={s.h2}>2. Qué datos recolectamos</h2>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.th}>Dato</th>
            <th className={s.th}>Origen</th>
            <th className={s.th}>¿Obligatorio?</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Correo electrónico", "Registro directo o cuenta de Google", "Sí"],
            [
              "Contraseña",
              "Registro directo (almacenada con hashing, nunca en texto plano)",
              "Sí, salvo registro solo con Google",
            ],
            ["Nombre de usuario y handle (@)", "Registro directo", "Sí"],
            ["Foto de perfil", "Subida voluntaria del usuario", "No"],
            ["Biografía de perfil", "Ingreso voluntario del usuario", "No"],
            ["Reseñas, puntajes y comentarios", "Publicados voluntariamente por el usuario", "—"],
            [
              "Relaciones de seguimiento (a quién seguís)",
              "Acción del usuario en la plataforma",
              "—",
            ],
            ["Reacciones (me gusta / no me gusta)", "Acción del usuario en la plataforma", "—"],
            ["Preferencias de notificación", "Configuración del usuario", "—"],
            [
              "Dirección IP y user-agent del dispositivo",
              "Automático, asociado a sesiones de acceso",
              "—",
            ],
            ["Registros de reportes creados o recibidos", "Uso del sistema de moderación", "—"],
          ].map(([dato, origen, obligatorio]) => (
            <tr key={dato}>
              <td className={s.td}>{dato}</td>
              <td className={s.td}>{origen}</td>
              <td className={s.td}>{obligatorio}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.p}>
        No solicitamos ni almacenamos datos sensibles (origen étnico, salud, opiniones políticas o
        religiosas, orientación sexual) más allá de lo que el propio usuario decida incluir
        voluntariamente en su biografía o reseñas, bajo su exclusiva responsabilidad.
      </p>

      <h2 className={s.h2}>3. Finalidad del tratamiento</h2>
      <ul className={s.ul}>
        <li>Crear y autenticar tu cuenta, y mantener tu sesión activa de forma segura.</li>
        <li>
          Permitirte publicar y gestionar reseñas, comentarios y relaciones de seguimiento con
          otros usuarios.
        </li>
        <li>Mostrarte un feed personalizado con la actividad de las cuentas que seguís.</li>
        <li>
          Enviarte notificaciones dentro de la plataforma sobre interacciones con tu contenido,
          según tus preferencias configuradas.
        </li>
        <li>
          Generar recomendaciones de álbumes y canciones basadas en tu historial de reseñas, una
          vez que alcanzás un mínimo de 3 reseñas publicadas.
        </li>
        <li>
          Calcular las secciones de tendencias a partir de la actividad agregada y anónima de la
          comunidad.
        </li>
        <li>
          Prevenir fraude, abuso, spam y contenido que infrinja nuestras normas de comunidad,
          incluyendo la operación del sistema de reportes y penalizaciones.
        </li>
        <li>Cumplir con obligaciones legales y responder a requerimientos de autoridades competentes.</li>
      </ul>

      <h2 className={s.h2}>4. Base legal y consentimiento</h2>
      <p className={s.p}>
        El tratamiento de tus datos se funda en el consentimiento informado y expreso que prestás
        al momento de registrarte, mediante la aceptación explícita de estos documentos. Este
        consentimiento queda registrado con fecha y hora en tu cuenta. Podés retirar tu
        consentimiento en cualquier momento eliminando tu cuenta, según se describe en la sección
        8.
      </p>

      <h2 className={s.h2}>5. Con quién compartimos datos</h2>
      <p className={s.p}>
        Vinlyst no vende tus datos personales a terceros. Compartimos información limitada con
        los siguientes proveedores, estrictamente para operar el Servicio:
      </p>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.th}>Proveedor</th>
            <th className={s.th}>Qué recibe</th>
            <th className={s.th}>Para qué</th>
          </tr>
        </thead>
        <tbody>
          {[
            [
              "Google (OAuth)",
              "Solicitud de autenticación, si elegís iniciar sesión con Google",
              "Verificar tu identidad sin que compartas una contraseña adicional con nosotros",
            ],
            [
              "Proveedores de catálogo musical (Deezer, MusicBrainz, Last.fm)",
              "Términos de búsqueda de álbumes, canciones y artistas",
              "Mostrarte resultados de catálogo musical y previews de audio; no reciben tus datos de cuenta ni el contenido de tus reseñas",
            ],
            [
              "Almacenamiento de imágenes (Cloudinary)",
              "Tu foto de perfil, si subís una",
              "Alojar y servir la imagen de forma optimizada",
            ],
            [
              "Proveedor de envío de correo",
              "Tu dirección de correo electrónico",
              "Enviarte verificación de cuenta, recuperación de contraseña, y avisos de suspensión",
            ],
            [
              "Monitoreo de errores (Sentry)",
              "Datos técnicos de errores de la aplicación (sin contraseñas)",
              "Detectar y corregir fallas del Servicio",
            ],
          ].map(([proveedor, recibe, para]) => (
            <tr key={proveedor}>
              <td className={s.td}>{proveedor}</td>
              <td className={s.td}>{recibe}</td>
              <td className={s.td}>{para}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={s.callout}>
        <p className={s.calloutText}>
          Ninguno de estos proveedores recibe tu contraseña. Las búsquedas de catálogo musical se
          realizan sin asociar tu identidad de usuario a la consulta.
        </p>
      </div>

      <h2 className={s.h2}>6. Seguridad de la información</h2>
      <ul className={s.ul}>
        <li>
          Las contraseñas se almacenan mediante funciones de hashing criptográfico de un solo
          sentido (nunca en texto plano ni de forma reversible).
        </li>
        <li>Todo el tráfico entre tu dispositivo y nuestros servidores viaja cifrado mediante HTTPS.</li>
        <li>
          El acceso a la plataforma se gestiona con tokens de sesión de corta duración, renovados
          de forma segura y revocados automáticamente ante actividad sospechosa.
        </li>
        <li>
          Limitamos el acceso interno a datos personales al personal estrictamente necesario para
          operar y dar soporte al Servicio.
        </li>
      </ul>
      <p className={s.p}>
        Ante una eventual brecha de seguridad que comprometa datos personales, notificaremos a los
        usuarios afectados y a la autoridad de control competente conforme a la normativa vigente,
        tan pronto como sea razonablemente posible.
      </p>

      <h2 className={s.h2}>7. Plazo de conservación</h2>
      <p className={s.p}>
        Conservamos tus datos personales mientras tu cuenta permanezca activa. Las reseñas y
        comentarios se conservan mientras no los elimines o elimines tu cuenta, dado que forman
        parte del historial público de la comunidad. Los registros técnicos de acceso (dirección
        IP, user-agent) se conservan por un plazo limitado con fines de seguridad y luego se
        depuran.
      </p>

      <h2 className={s.h2}>8. Tus derechos: acceso, rectificación y supresión</h2>
      <p className={s.p}>
        Como titular de tus datos personales, en cualquier momento podés ejercer los siguientes
        derechos desde la configuración de tu cuenta, o escribiéndonos a{" "}
        <a href="mailto:privacidad@vinlyst.app" className={s.a}>
          privacidad@vinlyst.app
        </a>
        :
      </p>
      <ul className={s.ul}>
        <li>
          <strong>Derecho de acceso:</strong> podés descargar una copia completa de tus datos
          personales, reseñas y comentarios almacenados en formato exportable.
        </li>
        <li>
          <strong>Derecho de rectificación:</strong> podés corregir tu nombre de usuario, handle,
          biografía y foto de perfil en cualquier momento.
        </li>
        <li>
          <strong>Derecho de supresión (derecho al olvido):</strong> podés eliminar tu cuenta en
          cualquier momento. Esta acción es irreversible.
        </li>
      </ul>

      <h3 className={s.h3}>8.1 Qué ocurre al eliminar tu cuenta</h3>
      <p className={s.p}>
        Al eliminar tu cuenta, ejecutamos de inmediato un proceso de anonimización irreversible:
        tu correo electrónico, handle y nombre se reemplazan por valores genéricos no
        identificables, tu contraseña se elimina, tu foto de perfil y biografía se borran, y se
        revocan todas tus sesiones activas.
      </p>
      <p className={s.p}>
        Tus reseñas, puntajes y comentarios ya publicados permanecen visibles en la plataforma,
        para no romper el contexto de conversaciones e interacciones de otros usuarios, pero
        quedan atribuidos a esa cuenta anonimizada — sin ningún dato que permita volver a
        identificarte como su autor.
      </p>

      <h2 className={s.h2}>9. Menores de edad</h2>
      <p className={s.p}>
        Vinlyst no está dirigido a menores de 13 años, y su uso por menores de 18 años requiere
        la supervisión de sus padres o tutores legales. No recolectamos deliberadamente datos de
        menores de 13 años; si tomamos conocimiento de que esto ha ocurrido, eliminaremos esa
        cuenta y sus datos asociados.
      </p>

      <h2 className={s.h2}>10. Cookies y almacenamiento local</h2>
      <p className={s.p}>
        Vinlyst utiliza almacenamiento local del navegador estrictamente necesario para mantener
        tu sesión iniciada y recordar preferencias de interfaz (como el estado de la barra de
        navegación). No utilizamos cookies de publicidad ni de rastreo de terceros con fines
        comerciales.
      </p>

      <h2 className={s.h2}>11. Transferencias internacionales</h2>
      <p className={s.p}>
        Algunos de nuestros proveedores de infraestructura (alojamiento, base de datos,
        almacenamiento de imágenes) pueden procesar datos en servidores ubicados fuera de la
        República Argentina. En esos casos, exigimos contractualmente a esos proveedores un nivel
        de protección de datos adecuado, equivalente al exigido por la Ley N.º 25.326.
      </p>

      <h2 className={s.h2}>12. Cambios a esta política</h2>
      <p className={s.p}>
        Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas
        o en la normativa aplicable. Ante cambios sustanciales sobre cómo tratamos tus datos, te
        notificaremos dentro de la plataforma antes de que entren en vigencia.
      </p>

      <h2 className={s.h2}>13. Autoridad de control</h2>
      <p className={s.p}>
        Tenés derecho a presentar una reclamación ante la Agencia de Acceso a la Información
        Pública (AAIP), órgano de control de la Ley N.º 25.326, en caso de considerar que el
        tratamiento de tus datos personales no se ajusta a la normativa vigente.
      </p>

      <h2 className={s.h2}>14. Contacto</h2>
      <p className={s.p}>
        Para consultas sobre esta Política de Privacidad o para ejercer cualquiera de tus
        derechos, escribinos a{" "}
        <a href="mailto:privacidad@vinlyst.app" className={s.a}>
          privacidad@vinlyst.app
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
