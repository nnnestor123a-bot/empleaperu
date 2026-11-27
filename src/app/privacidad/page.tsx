export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-extrabold text-[#12336B] dark:text-white">
        Política de Privacidad y Protección de Datos Personales
      </h1>
      <p className="text-xs text-slate-500">
        Referencia orientativa a la Ley N.° 29733 (Ley de Protección de Datos Personales del Perú). Este entorno es una implementación local educativa/demostrativa y no constituye certificación legal formal.
      </p>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <p><strong>1. Consentimiento y minimización:</strong> Solo solicitamos los datos necesarios para el registro, creación del perfil profesional y gestión de postulaciones.</p>
        <p><strong>2. Resguardo de CVs:</strong> Los archivos PDF y DOCX se guardan fuera de la carpeta pública con nombres aleatorios y verificación de autorización en servidor antes de cada descarga.</p>
        <p><strong>3. No discriminación algorítmica:</strong> El cálculo de compatibilidad nunca utiliza edad, sexo, religión, discapacidad, estado civil u otros atributos protegidos.</p>
        <p><strong>4. Derechos ARCO / Portabilidad:</strong> Desde tu perfil de postulante puedes controlar la visibilidad de tu correo, teléfono y portafolio público, así como exportar tus datos en formato JSON.</p>
      </div>
    </div>
  );
}
