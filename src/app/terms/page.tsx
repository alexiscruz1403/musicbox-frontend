import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { legalStyles as s } from "@/components/legal/legal-styles";

export const metadata = {
  title: "Términos y Condiciones — Vinlyst",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Términos y Condiciones de Vinlyst"
      lastUpdated="Última actualización: 10 de julio de 2026 · Vigentes desde su publicación"
    >
      <p className={s.p} style={{ marginTop: "20px" }}>
        Bienvenido/a a Vinlyst. Estos Términos y Condiciones (&quot;Términos&quot;) rigen el
        acceso y uso de la aplicación web Vinlyst (el &quot;Servicio&quot;), operada desde la
        República Argentina. Al crear una cuenta o utilizar el Servicio, aceptás estos Términos y
        nuestra{" "}
        <Link href="/privacy" className={s.a}>
          Política de Privacidad
        </Link>{" "}
        en su totalidad. Si no estás de acuerdo, no debés utilizar Vinlyst.
      </p>

      <h2 className={s.h2}>1. Descripción del servicio</h2>
      <p className={s.p}>
        Vinlyst es una red social de reseñas musicales. Permite a los usuarios buscar álbumes y
        canciones de un catálogo provisto por proveedores externos, publicar reseñas con un
        puntaje de 1 a 10, calificar canciones individuales dentro de un álbum, seguir a otros
        usuarios, comentar y reaccionar a reseñas, y descubrir música mediante secciones de
        tendencias y recomendaciones personalizadas.
      </p>
      <div className={s.callout}>
        <p className={s.calloutText}>
          <strong>Vinlyst no aloja ni distribuye archivos de audio.</strong> Los previews de 30
          segundos y la metadata de catálogo (portadas, títulos, artistas, duración) provienen de
          proveedores externos y se muestran únicamente con fines de identificación del contenido
          reseñado.
        </p>
      </div>

      <h2 className={s.h2}>2. Elegibilidad y creación de cuenta</h2>
      <p className={s.p}>
        Para usar Vinlyst necesitás crear una cuenta con un correo electrónico y contraseña, o
        mediante autenticación con tu cuenta de Google. Sos responsable de mantener la
        confidencialidad de tus credenciales y de toda actividad que ocurra bajo tu cuenta.
      </p>
      <ul className={s.ul}>
        <li>
          Tu <strong>handle</strong> (identificador único precedido por <code>@</code>) debe tener
          entre 3 y 30 caracteres, usando solo letras, números y guiones bajos, y no puede
          infringir marcas registradas ni suplantar a terceros.
        </li>
        <li>Debés proporcionar información veraz al registrarte y mantenerla actualizada.</li>
        <li>
          Al registrarte, prestás consentimiento explícito e informado para el tratamiento de tus
          datos personales conforme a nuestra Política de Privacidad, registrado con fecha y hora
          en tu cuenta.
        </li>
        <li>
          Vinlyst se reserva el derecho de suspender o eliminar cuentas que incumplan estos
          Términos.
        </li>
      </ul>

      <h2 className={s.h2}>3. Contenido generado por el usuario</h2>
      <p className={s.p}>
        Al publicar una reseña, comentario, biografía de perfil o cualquier otro contenido
        (&quot;Contenido de Usuario&quot;), declarás que:
      </p>
      <ul className={s.ul}>
        <li>Es tuyo, original, o contás con los derechos necesarios para publicarlo.</li>
        <li>
          No contiene lenguaje difamatorio, discriminatorio, de acoso, spam, publicidad no
          solicitada, ni información falsa presentada como hecho.
        </li>
        <li>
          Otorgás a Vinlyst una licencia no exclusiva, mundial y libre de regalías para
          almacenar, mostrar y distribuir ese contenido dentro del Servicio, mientras tu cuenta y
          el contenido permanezcan activos.
        </li>
      </ul>
      <p className={s.p}>
        Conservás la titularidad de tu Contenido de Usuario. Podés eliminar tus reseñas y
        comentarios individualmente en cualquier momento; su eliminación es lógica e inmediata en
        la interfaz.
      </p>

      <h3 className={s.h3}>3.1 Puntajes y cálculo de calificaciones</h3>
      <p className={s.p}>
        Las reseñas de canciones llevan un puntaje de 1 a 10 asignado directamente por el usuario.
        Las reseñas de álbum calculan su puntaje final como el{" "}
        <strong>promedio de los puntajes asignados a cada canción</strong> incluida en la reseña;
        este valor se calcula y almacena en el momento de publicar o editar la reseña, y no se
        recalcula retroactivamente si el usuario no vuelve a editarla.
      </p>

      <h2 className={s.h2}>4. Normas de la comunidad y moderación</h2>
      <p className={s.p}>
        Vinlyst es un espacio para el intercambio de opiniones sobre música. No se tolera
        contenido que constituya acoso, discurso de odio, spam o publicidad no autorizada,
        desinformación deliberada, o suplantación de identidad.
      </p>

      <h3 className={s.h3}>4.1 Sistema de reportes</h3>
      <p className={s.p}>
        Cualquier usuario puede reportar una reseña, un comentario o una cuenta que considere en
        infracción de estas normas, indicando un motivo. Los reportes son revisados por el equipo
        de moderación de Vinlyst, que puede aceptarlos (confirmando la infracción) o
        descartarlos.
      </p>
      <p className={s.p}>
        Cuando se acepta un reporte sobre una reseña o un comentario, ese contenido se oculta de
        la vista pública y se notifica a su autor dentro de la plataforma. Cuando se acepta un
        reporte sobre una cuenta, no se aplica esta ocultación, pero sí se computa la penalización
        descripta a continuación.
      </p>

      <h3 className={s.h3}>4.2 Penalizaciones escalonadas por reportes aceptados</h3>
      <p className={s.p}>
        Vinlyst aplica un sistema automático de penalización creciente sobre las cuentas cuyo
        contenido o comportamiento acumula reportes aceptados por moderación. Cada reporte
        aceptado sobre contenido o la cuenta de un usuario suma 1 a su contador acumulado, incluso
        si varios reportes distintos se refieren al mismo contenido.
      </p>
      <p className={s.p}>
        Cada 3 reportes aceptados, la cuenta cruza un nuevo nivel de penalización temporal, según
        la siguiente escala:
      </p>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.th}>Reportes aceptados acumulados</th>
            <th className={s.th}>Nivel</th>
            <th className={s.th}>Restricción aplicada</th>
          </tr>
        </thead>
        <tbody>
          {[
            [3, 1, "1 día sin poder publicar reseñas ni comentarios"],
            [6, 2, "2 días de la misma restricción"],
            [9, 3, "3 días"],
            [12, 4, "4 días"],
            [15, 5, "5 días"],
            [18, 6, "6 días"],
            [21, 7, "7 días"],
          ].map(([count, level, restriction]) => (
            <tr key={level}>
              <td className={s.td}>{count}</td>
              <td className={s.td}>{level}</td>
              <td className={s.td}>{restriction}</td>
            </tr>
          ))}
          <tr>
            <td className={s.td}>24</td>
            <td className={s.td}>8</td>
            <td className={s.td}>
              <strong>Suspensión automática de la cuenta</strong>, notificada por correo
              electrónico
            </td>
          </tr>
        </tbody>
      </table>
      <p className={s.p}>
        Cada nueva penalización reemplaza el plazo restante de una anterior; los plazos no se
        acumulan entre sí. Mientras una penalización esté activa, la cuenta conserva acceso de
        lectura, reacciones y seguimiento de otros usuarios, pero no puede crear reseñas ni
        comentarios nuevos. Una cuenta suspendida —ya sea automáticamente por este sistema o
        manualmente por el equipo de Vinlyst— no puede iniciar sesión ni continuar usando el
        Servicio.
      </p>
      <p className={s.p}>
        Vinlyst se reserva la facultad de suspender o eliminar cualquier cuenta de forma manual,
        sin necesidad de agotar esta escala, ante infracciones graves.
      </p>

      <h2 className={s.h2}>5. Catálogo musical y proveedores externos</h2>
      <p className={s.p}>
        La información de álbumes, canciones, artistas y los previews de audio de 30 segundos que
        se muestran en Vinlyst son obtenidos de bases de datos musicales de terceros. Vinlyst no
        es propietario de esa metadata, no garantiza su exactitud o disponibilidad continua, y no
        está afiliado, patrocinado ni respaldado por dichos proveedores ni por los artistas,
        sellos discográficos o titulares de derechos de las obras referenciadas.
      </p>
      <p className={s.p}>
        Al momento de publicar una reseña, Vinlyst conserva una copia del título, artista y
        portada del álbum o canción reseñada, de forma que tu reseña siga siendo legible aun si
        esa información cambia o deja de estar disponible en el proveedor externo.
      </p>

      <h2 className={s.h2}>6. Notificaciones</h2>
      <p className={s.p}>
        Vinlyst te notifica dentro de la plataforma cuando otro usuario da &quot;me gusta&quot; o
        &quot;no me gusta&quot; a tu reseña, la comenta, o comienza a seguirte, así como ante
        decisiones de moderación que afecten tu contenido o cuenta. Podés desactivar cada tipo de
        notificación social de forma individual, o todas en conjunto, desde la configuración de tu
        cuenta. Las notificaciones vinculadas a decisiones de moderación sobre tu cuenta no pueden
        desactivarse.
      </p>

      <h2 id="privacidad" className={s.h2}>
        7. Privacidad y protección de datos personales
      </h2>
      <p className={s.p}>
        Vinlyst trata tus datos personales conforme a la Ley N.º 25.326 de Protección de Datos
        Personales de la República Argentina. Recolectamos únicamente los datos necesarios para
        operar el Servicio: correo electrónico, contraseña (almacenada de forma irreversible
        mediante hashing criptográfico), nombre de usuario, handle, y opcionalmente biografía y
        foto de perfil.
      </p>
      <p className={s.p}>Como titular de tus datos, tenés derecho a:</p>
      <ul className={s.ul}>
        <li>
          <strong>Acceso:</strong> solicitar y descargar una copia de todos tus datos, reseñas y
          comentarios almacenados.
        </li>
        <li>
          <strong>Rectificación:</strong> corregir tus datos de perfil en cualquier momento desde
          la configuración de tu cuenta.
        </li>
        <li>
          <strong>Supresión (derecho al olvido):</strong> eliminar tu cuenta. Al hacerlo, tus datos
          personales identificables (correo, handle, nombre, foto, biografía, contraseña) se
          anonimizan de forma irreversible. Tus reseñas y comentarios permanecen visibles para
          preservar el contexto de las conversaciones de la comunidad, pero quedan atribuidos a
          una cuenta anonimizada, sin ningún dato que permita identificarte.
        </li>
      </ul>
      <p className={s.p}>
        Tus contraseñas se almacenan mediante funciones de hashing criptográfico de un solo
        sentido; Vinlyst nunca tiene acceso a tu contraseña en texto plano. Todas las
        comunicaciones con el Servicio están cifradas mediante HTTPS. Para el detalle completo
        sobre qué datos recolectamos, con quién los compartimos y cómo ejercer tus derechos,
        consultá nuestra{" "}
        <Link href="/privacy" className={s.a}>
          Política de Privacidad
        </Link>
        .
      </p>

      <h2 className={s.h2}>8. Propiedad intelectual</h2>
      <p className={s.p}>
        El nombre &quot;Vinlyst&quot;, su logo, diseño de interfaz y el software subyacente son
        propiedad de Vinlyst o sus licenciantes. Los títulos, portadas y grabaciones referenciados
        en el catálogo pertenecen a sus respectivos titulares de derechos; su exhibición en
        Vinlyst se realiza a título informativo, en el marco de las reseñas y comentarios de los
        usuarios sobre esas obras.
      </p>

      <h2 className={s.h2}>9. Limitación de responsabilidad</h2>
      <p className={s.p}>
        El Servicio se provee &quot;tal cual&quot; y &quot;según disponibilidad&quot;. Vinlyst no
        garantiza que el Servicio esté libre de interrupciones, errores, o que el catálogo musical
        de terceros esté siempre disponible o actualizado. Las opiniones expresadas en las reseñas
        y comentarios son exclusivamente de sus autores y no representan la posición de Vinlyst.
        En la máxima medida permitida por la ley aplicable, Vinlyst no será responsable por daños
        indirectos, incidentales o consecuentes derivados del uso del Servicio.
      </p>

      <h2 className={s.h2}>10. Modificaciones a estos Términos</h2>
      <p className={s.p}>
        Podemos actualizar estos Términos para reflejar cambios en el Servicio o en la normativa
        aplicable. Ante cambios sustanciales, notificaremos a los usuarios registrados dentro de
        la plataforma antes de que entren en vigencia. El uso continuado del Servicio tras la
        entrada en vigencia de los cambios implica su aceptación.
      </p>

      <h2 className={s.h2}>11. Ley aplicable y jurisdicción</h2>
      <p className={s.p}>
        Estos Términos se rigen por las leyes de la República Argentina. Cualquier controversia
        derivada de su interpretación o cumplimiento se someterá a los tribunales ordinarios
        competentes de la Ciudad Autónoma de Buenos Aires, sin perjuicio de las normas de
        protección al consumidor que resulten de aplicación imperativa.
      </p>

      <h2 className={s.h2}>12. Contacto</h2>
      <p className={s.p}>
        Para consultas sobre estos Términos, ejercicio de derechos sobre tus datos personales, o
        para reportar una inquietud que no pueda resolverse mediante el sistema de reportes dentro
        de la plataforma, podés escribirnos a{" "}
        <a href="mailto:legal@vinlyst.app" className={s.a}>
          legal@vinlyst.app
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
