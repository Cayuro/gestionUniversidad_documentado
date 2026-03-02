import csv
import random

# 1. Configuración inicial
NUM_REGISTROS = 1000
ARCHIVO_SALIDA = 'simulacro_unigestion_data.csv'

# Listas base para generar estudiantes
nombres_base = ["Juan", "Maria", "Carlos", "Laura", "Andres", "Sofia", "Diego", "Valentina", "Alejandro", "Camila", "Mateo", "Isabella", "Daniel", "Valeria"]
apellidos_base = ["Perez", "Lopez", "Mendoza", "Diaz", "Castro", "Gomez", "Ramirez", "Torres", "Vargas", "Rojas", "Silva", "Ortiz", "Morales", "Herrera"]

# 2. Base de datos simulada de Cursos y Profesores
cursos = [
    {"dept": "Ingenieria", "code": "CS101", "name": "Introduccion a la Programacion", "credits": 4, "prof_name": "Dra. Ana Silva", "prof_email": "a.silva@unigestion.edu"},
    {"dept": "Ingenieria", "code": "CS102", "name": "Estructuras de Datos", "credits": 4, "prof_name": "Dr. Carlos Ruiz", "prof_email": "c.ruiz@unigestion.edu"},
    {"dept": "Ingenieria", "code": "DB201", "name": "Bases de Datos", "credits": 3, "prof_name": "Ing. Marcos Paz", "prof_email": "m.paz@unigestion.edu"},
    {"dept": "Humanidades", "code": "HUM105", "name": "Etica Profesional", "credits": 2, "prof_name": "Prof. Luis Gomez", "prof_email": "l.gomez@unigestion.edu"},
    {"dept": "Humanidades", "code": "HUM201", "name": "Historia Universal", "credits": 3, "prof_name": "Dra. Marta Peña", "prof_email": "m.pena@unigestion.edu"},
    {"dept": "Ciencias", "code": "FIS101", "name": "Fisica Mecanica", "credits": 4, "prof_name": "Dr. Jorge Marin", "prof_email": "j.marin@unigestion.edu"},
    {"dept": "Matematicas", "code": "MAT201", "name": "Calculo Diferencial", "credits": 4, "prof_name": "Dr. Carlos Ruiz", "prof_email": "c.ruiz@unigestion.edu"},
    {"dept": "Negocios", "code": "ADM101", "name": "Fundamentos de Administracion", "credits": 3, "prof_name": "Mg. Clara Vega", "prof_email": "c.vega@unigestion.edu"},
]

# 3. Generar un pool de 150 estudiantes únicos
estudiantes = []
for _ in range(150):
    nombre = random.choice(nombres_base)
    apellido = random.choice(apellidos_base)
    nombre_completo = f"{nombre} {apellido}"
    # Generar email estándar: inicial.apellido@unigestion.edu
    email = f"{nombre[0].lower()}.{apellido.lower()}@unigestion.edu"
    # Generar teléfono aleatorio de 10 dígitos que empiece por 3
    telefono = f"3{random.randint(100000000, 999999999)}"
    
    estudiantes.append({
        "name": nombre_completo,
        "email": email,
        "phone": telefono
    })

# 4. Generar las 1000 filas de inscripciones (Kardex)
semestres = ["2023-1", "2023-2", "2024-1"]
filas = []

for _ in range(NUM_REGISTROS):
    estudiante = random.choice(estudiantes)
    curso = random.choice(cursos)
    
    # Extraer datos del estudiante
    std_name = estudiante["name"]
    std_email = estudiante["email"]
    std_phone = estudiante["phone"]
    
    # --- INTRODUCIR RUIDO (Dirty Data) PARA PROBAR LA NORMALIZACIÓN ---
    probabilidad_ruido = random.random()
    if probabilidad_ruido < 0.05:
        std_name = std_name.lower() # Nombre todo en minúsculas
    elif probabilidad_ruido < 0.10:
        std_email = std_email.upper() # Correo todo en mayúsculas
    elif probabilidad_ruido < 0.15:
        std_name = f"  {std_name}  " # Espacios en blanco accidentales
        
    semestre = random.choice(semestres)
    
    # Generar nota aleatoria entre 1.0 y 5.0 (redondeada a 1 decimal)
    nota = round(random.uniform(1.0, 5.0), 1)
    
    # Lógica financiera: El crédito cuesta $400,000 COP
    costo_matricula = curso["credits"] * 400000
    
    # El 90% paga completo, el 10% paga la mitad (deuda)
    monto_pagado = costo_matricula if random.random() > 0.10 else int(costo_matricula / 2)

    # Armar la fila
    fila = [
        std_name, std_email, std_phone,
        curso["prof_name"], curso["prof_email"], curso["dept"],
        curso["code"], curso["name"], curso["credits"],
        semestre, nota, costo_matricula, monto_pagado
    ]
    filas.append(fila)

# 5. Escribir el archivo CSV
headers = [
    "student_name", "student_email", "student_phone", 
    "professor_name", "professor_email", "department", 
    "course_code", "course_name", "credits", 
    "semester", "grade", "tuition_fee", "amount_paid"
]

with open(ARCHIVO_SALIDA, mode='w', newline='', encoding='utf-8') as archivo_csv:
    writer = csv.writer(archivo_csv)
    writer.writerow(headers)
    writer.writerows(filas)

print(f"✅ ¡Éxito! Se ha generado el archivo '{ARCHIVO_SALIDA}' con {NUM_REGISTROS} registros.")