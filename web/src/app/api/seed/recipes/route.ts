import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

const RECIPES = [
  // ── DESAYUNOS ────────────────────────────────────────────────────────────────
  { name:"Avena con banana y miel", cat:"desayuno", emoji:"🥣", cal:320, prot:10, carb:60, fat:5, prep:5, diff:"facil", diet:["omnivoro","vegetariano","vegano"], tags:["avena","banana","sin-gluten-no","alto-carbohidrato"], desc:"Avena cocida con banana en rodajas y una cucharada de miel. Ideal para energía preentrenamiento.", serv:1 },
  { name:"Tostadas con huevo revuelto", cat:"desayuno", emoji:"🍳", cal:380, prot:22, carb:35, fat:14, prep:10, diff:"facil", diet:["omnivoro"], tags:["huevo","tostada","proteico"], desc:"2 tostadas de pan integral con 3 huevos revueltos y una pizca de sal.", serv:1 },
  { name:"Yogur griego con granola", cat:"desayuno", emoji:"🍶", cal:290, prot:18, carb:38, fat:7, prep:3, diff:"facil", diet:["omnivoro","vegetariano"], tags:["yogur","granola","proteico","rapido"], desc:"200g de yogur griego natural con granola y frutas rojas.", serv:1 },
  { name:"Batido de proteína con leche", cat:"desayuno", emoji:"🥛", cal:350, prot:35, carb:30, fat:8, prep:3, diff:"facil", diet:["omnivoro","vegetariano"], tags:["proteina","batido","rapido","post-entreno"], desc:"Scoop de proteína de suero con 250ml de leche entera. Ideal post-entreno.", serv:1 },
  { name:"Pancakes de avena y huevo", cat:"desayuno", emoji:"🥞", cal:420, prot:28, carb:45, fat:12, prep:15, diff:"media", diet:["omnivoro","vegetariano"], tags:["avena","huevo","proteico","dulce"], desc:"3 huevos + 80g de avena + banana licuados. Cocinar en sartén antiadherente.", serv:2 },
  { name:"Tostada con palta y huevo pochado", cat:"desayuno", emoji:"🥑", cal:410, prot:16, carb:28, fat:28, prep:12, diff:"media", diet:["omnivoro","vegetariano"], tags:["palta","huevo","grasas-buenas"], desc:"Pan integral tostado con media palta aplastada y un huevo pochado encima.", serv:1 },
  { name:"Bol de frutas con semillas", cat:"desayuno", emoji:"🍓", cal:250, prot:6, carb:48, fat:8, prep:5, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["frutas","semillas","vegano","liviano"], desc:"Mezcla de frutas de estación con semillas de chía y calabaza.", serv:1 },
  { name:"Omelette de espinaca y queso", cat:"desayuno", emoji:"🍽️", cal:300, prot:24, carb:4, fat:20, prep:10, diff:"facil", diet:["omnivoro","vegetariano"], tags:["huevo","espinaca","queso","bajo-carbohidrato"], desc:"3 huevos batidos con espinaca salteada y queso rallado.", serv:1 },
  { name:"Tostadas de mantequilla de maní", cat:"desayuno", emoji:"🥜", cal:460, prot:16, carb:42, fat:26, prep:5, diff:"facil", diet:["omnivoro","vegetariano","vegano"], tags:["mani","tostada","grasas-buenas"], desc:"Pan integral con 2 cucharadas de mantequilla de maní natural.", serv:1 },
  { name:"Porridge de avena con frutas secas", cat:"desayuno", emoji:"🍯", cal:380, prot:12, carb:65, fat:9, prep:8, diff:"facil", diet:["omnivoro","vegetariano","vegano"], tags:["avena","frutos-secos","energetico"], desc:"Avena cocida con agua o leche vegetal, pasas, nueces y canela.", serv:1 },
  { name:"Licuado de frutilla y espinaca", cat:"desayuno", emoji:"🍹", cal:180, prot:4, carb:36, fat:2, prep:5, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["verde","frutilla","liviano","vegano"], desc:"Frutillas, espinaca baby, banana y agua de coco licuados. Sin azúcar agregada.", serv:1 },
  { name:"Muffins de avena y arándanos", cat:"desayuno", emoji:"🧁", cal:220, prot:7, carb:40, fat:5, prep:25, diff:"media", diet:["omnivoro","vegetariano"], tags:["avena","arandanos","horneado"], desc:"Muffins sin azúcar con avena, huevo, banana y arándanos.", serv:2 },

  // ── ALMUERZOS ────────────────────────────────────────────────────────────────
  { name:"Pollo con arroz y vegetales", cat:"almuerzo", emoji:"🍗", cal:620, prot:48, carb:65, fat:14, prep:30, diff:"facil", diet:["omnivoro"], tags:["pollo","arroz","clasico","proteico"], desc:"200g de pechuga de pollo a la plancha con arroz integral y brócoli al vapor.", serv:1 },
  { name:"Milanesa de pollo con puré", cat:"almuerzo", emoji:"🍖", cal:720, prot:52, carb:58, fat:22, prep:35, diff:"media", diet:["omnivoro"], tags:["pollo","pure","milanesa","tradicional"], desc:"Pechuga apanada al horno con puré de papas casero.", serv:1 },
  { name:"Lomo saltado", cat:"almuerzo", emoji:"🥩", cal:580, prot:45, carb:40, fat:20, prep:25, diff:"media", diet:["omnivoro"], tags:["carne","peru","papas","salteado"], desc:"Lomo en tiras salteado con cebolla, tomate y papas fritas. Receta peruana.", serv:1 },
  { name:"Pasta con salsa boloñesa", cat:"almuerzo", emoji:"🍝", cal:680, prot:40, carb:72, fat:22, prep:40, diff:"media", diet:["omnivoro"], tags:["pasta","carne-molida","italiano","carbohidrato"], desc:"Pasta integral con salsa de carne molida, tomate y queso rallado.", serv:1 },
  { name:"Arroz con lentejas (Mujadara)", cat:"almuerzo", emoji:"🍚", cal:520, prot:22, carb:80, fat:12, prep:35, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["lentejas","arroz","vegano","proteina-vegetal"], desc:"Arroz y lentejas cocidos juntos con cebolla caramelizada. Plato árabe clásico.", serv:2 },
  { name:"Salmón con quinoa y espárragos", cat:"almuerzo", emoji:"🐟", cal:590, prot:52, carb:38, fat:24, prep:25, diff:"media", diet:["omnivoro","sin_gluten"], tags:["salmon","quinoa","omega-3","proteico"], desc:"Filet de salmón al horno con quinoa y espárragos grillados.", serv:1 },
  { name:"Ensalada César con pollo", cat:"almuerzo", emoji:"🥗", cal:450, prot:38, carb:18, fat:25, prep:15, diff:"facil", diet:["omnivoro"], tags:["pollo","ensalada","bajo-carbohidrato","liviano"], desc:"Lechuga romana, pollo grillado, crutones, parmesano y aderezo César.", serv:1 },
  { name:"Locro argentino", cat:"almuerzo", emoji:"🫕", cal:750, prot:42, carb:68, fat:30, prep:120, diff:"dificil", diet:["omnivoro"], tags:["tradicional","argentina","contundente","invierno"], desc:"Guiso de maíz, porotos, chorizo, panceta y carne. El clásico nacional.", serv:4 },
  { name:"Cazuela de pollo con verduras", cat:"almuerzo", emoji:"🍲", cal:520, prot:44, carb:32, fat:18, prep:45, diff:"media", diet:["omnivoro","sin_gluten"], tags:["pollo","verduras","guiso","saludable"], desc:"Pollo en trozos con zanahorias, papas, cebolla y caldo de pollo.", serv:2 },
  { name:"Tarta de espinaca y queso", cat:"almuerzo", emoji:"🥧", cal:480, prot:24, carb:42, fat:24, prep:50, diff:"media", diet:["omnivoro","vegetariano"], tags:["espinaca","queso","tarta","vegetariano"], desc:"Tarta de masa casera rellena de espinaca, cebolla y queso.", serv:4 },
  { name:"Albóndigas en salsa de tomate", cat:"almuerzo", emoji:"🍝", cal:620, prot:42, carb:45, fat:28, prep:45, diff:"media", diet:["omnivoro"], tags:["carne-molida","tomate","clasico","familiar"], desc:"Albóndigas de carne molida en salsa de tomate casera con pasta.", serv:2 },
  { name:"Fideos con atún y tomate", cat:"almuerzo", emoji:"🍜", cal:560, prot:38, carb:68, fat:12, prep:20, diff:"facil", diet:["omnivoro"], tags:["atun","pasta","rapido","economico"], desc:"Fideos integrales con atún al natural, tomate perita y olivas.", serv:1 },
  { name:"Hamburguesa casera con batata", cat:"almuerzo", emoji:"🍔", cal:680, prot:46, carb:52, fat:28, prep:30, diff:"media", diet:["omnivoro"], tags:["carne","hamburguesa","batata","proteico"], desc:"Hamburguesa de carne casera en pan integral con batata al horno.", serv:1 },
  { name:"Wok de pollo con vegetales", cat:"almuerzo", emoji:"🥢", cal:480, prot:42, carb:32, fat:16, prep:20, diff:"facil", diet:["omnivoro","sin_gluten"], tags:["pollo","oriental","rapido","bajo-carbohidrato"], desc:"Pollo y vegetales salteados en wok con salsa de soja y jengibre.", serv:1 },
  { name:"Empanadas de carne al horno", cat:"almuerzo", emoji:"🥟", cal:480, prot:28, carb:52, fat:18, prep:60, diff:"dificil", diet:["omnivoro"], tags:["argentina","empanada","tradicional"], desc:"Empanadas de carne cortada a cuchillo con cebolla, huevo y aceitunas.", serv:4 },
  { name:"Pollo al curry con arroz basmati", cat:"almuerzo", emoji:"🍛", cal:620, prot:46, carb:58, fat:18, prep:35, diff:"media", diet:["omnivoro","sin_gluten"], tags:["pollo","curry","indio","especiado"], desc:"Pechuga de pollo en salsa de curry con leche de coco y arroz basmati.", serv:2 },
  { name:"Ensalada de garbanzos", cat:"almuerzo", emoji:"🫘", cal:380, prot:18, carb:52, fat:12, prep:10, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["garbanzo","vegano","proteina-vegetal","rapido"], desc:"Garbanzos cocidos con tomate, pepino, cebolla morada y limón.", serv:1 },
  { name:"Carne a la cacerola con papas", cat:"almuerzo", emoji:"🥘", cal:680, prot:48, carb:45, fat:26, prep:90, diff:"media", diet:["omnivoro","sin_gluten"], tags:["carne","papas","guiso","argentina"], desc:"Corte de carne braseado con papas, zanahorias y cebolla.", serv:3 },
  { name:"Bowl de quinoa y atún", cat:"almuerzo", emoji:"🥙", cal:480, prot:40, carb:46, fat:12, prep:15, diff:"facil", diet:["omnivoro","sin_gluten"], tags:["quinoa","atun","bowl","proteico","saludable"], desc:"Quinoa cocida con atún, aguacate, tomate cherry y vinagreta.", serv:1 },
  { name:"Risotto de champiñones", cat:"almuerzo", emoji:"🍄", cal:520, prot:16, carb:72, fat:18, prep:35, diff:"dificil", diet:["omnivoro","vegetariano"], tags:["arroz","champignon","italiano","cremoso"], desc:"Arroz arbóreo con champiñones, vino blanco, manteca y parmesano.", serv:2 },

  // ── CENAS ────────────────────────────────────────────────────────────────────
  { name:"Tortilla de verduras al horno", cat:"cena", emoji:"🫔", cal:320, prot:22, carb:20, fat:18, prep:25, diff:"facil", diet:["omnivoro","vegetariano","sin_gluten"], tags:["huevo","verduras","liviano","bajo-carbohidrato"], desc:"Tortilla al horno con zucchini, morrón y queso. Cena liviana.", serv:2 },
  { name:"Sopa de pollo con fideos", cat:"cena", emoji:"🍜", cal:380, prot:30, carb:38, fat:10, prep:40, diff:"facil", diet:["omnivoro"], tags:["sopa","pollo","reconfortante","invierno"], desc:"Caldo casero de pollo con fideos cabello de ángel y verduras.", serv:2 },
  { name:"Pescado al limón con ensalada", cat:"cena", emoji:"🐡", cal:380, prot:42, carb:10, fat:18, prep:20, diff:"facil", diet:["omnivoro","sin_gluten"], tags:["pescado","limón","liviano","proteico"], desc:"Merluza o tilapia al horno con limón, ajo y ensalada verde.", serv:1 },
  { name:"Revuelto de huevos con espinaca", cat:"cena", emoji:"🍳", cal:280, prot:22, carb:6, fat:18, prep:10, diff:"facil", diet:["omnivoro","vegetariano","sin_gluten"], tags:["huevo","espinaca","bajo-carbohidrato","rapido"], desc:"3 huevos revueltos con espinaca fresca y tomate cherry.", serv:1 },
  { name:"Sopa de lentejas", cat:"cena", emoji:"🥣", cal:340, prot:18, carb:52, fat:8, prep:40, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["lentejas","sopa","vegano","proteina-vegetal"], desc:"Lentejas con zanahoria, apio, cebolla y tomate. Reconfortante.", serv:2 },
  { name:"Pavo a la plancha con brócoli", cat:"cena", emoji:"🦃", cal:340, prot:46, carb:8, fat:12, prep:20, diff:"facil", diet:["omnivoro","sin_gluten"], tags:["pavo","brocoli","proteico","bajo-carbohidrato"], desc:"Pechugas de pavo magras con brócoli al vapor. Alta proteína.", serv:1 },
  { name:"Crema de zapallo", cat:"cena", emoji:"🎃", cal:220, prot:6, carb:35, fat:8, prep:35, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["zapallo","sopa","vegano","liviano"], desc:"Zapallo cocido y procesado con leche vegetal, jengibre y cúrcuma.", serv:2 },
  { name:"Atún con huevo y espárragos", cat:"cena", emoji:"🐟", cal:320, prot:42, carb:6, fat:14, prep:15, diff:"facil", diet:["omnivoro","sin_gluten"], tags:["atun","huevo","esparragos","proteico","bajo-carbohidrato"], desc:"Lata de atún con huevo duro y espárragos salteados. Rápido y proteico.", serv:1 },
  { name:"Wraps de pollo y vegetales", cat:"cena", emoji:"🌯", cal:480, prot:38, carb:46, fat:14, prep:20, diff:"facil", diet:["omnivoro"], tags:["pollo","wrap","saludable","practico"], desc:"Tortilla de trigo con tiras de pollo, lechuga, tomate y hummus.", serv:1 },
  { name:"Budín de pan (sin azúcar)", cat:"cena", emoji:"🍮", cal:280, prot:12, carb:42, fat:8, prep:50, diff:"media", diet:["omnivoro","vegetariano"], tags:["sin-azucar","horneado","postre-sano"], desc:"Budín de pan con leche, huevos y edulcorante. Sin azúcar agregada.", serv:4 },
  { name:"Pollo al horno con papas rústicas", cat:"cena", emoji:"🍗", cal:620, prot:48, carb:52, fat:20, prep:60, diff:"facil", diet:["omnivoro","sin_gluten"], tags:["pollo","papas","horno","clasico"], desc:"Muslos de pollo al horno con papas en cubos, romero y ajo.", serv:2 },
  { name:"Tacos de carne molida", cat:"cena", emoji:"🌮", cal:560, prot:38, carb:50, fat:22, prep:25, diff:"facil", diet:["omnivoro"], tags:["carne","taco","mexicano","familiar"], desc:"Carne molida condimentada con cilantro, tomate y queso en tortillas.", serv:2 },

  // ── SNACKS ───────────────────────────────────────────────────────────────────
  { name:"Mix de nueces y frutas secas", cat:"snack", emoji:"🥜", cal:280, prot:8, carb:24, fat:18, prep:1, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["nueces","frutos-secos","grasas-buenas","rapido"], desc:"Mezcla de nueces, almendras, pasas y arándanos deshidratados.", serv:1 },
  { name:"Hummus con bastones de verduras", cat:"snack", emoji:"🥕", cal:220, prot:8, carb:28, fat:10, prep:5, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["hummus","vegano","saludable","fibra"], desc:"Hummus de garbanzo con zanahoria, apio y morrón en bastones.", serv:1 },
  { name:"Yogur con semillas de chía", cat:"snack", emoji:"🫙", cal:190, prot:14, carb:22, fat:5, prep:5, diff:"facil", diet:["omnivoro","vegetariano","sin_gluten"], tags:["yogur","chia","proteico","rapido"], desc:"Yogur natural con semillas de chía hidratadas. Alto en proteína.", serv:1 },
  { name:"Manzana con mantequilla de almendra", cat:"snack", emoji:"🍎", cal:250, prot:6, carb:32, fat:12, prep:3, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["manzana","almendra","grasas-buenas","rapido"], desc:"Manzana en rodajas con 2 cucharadas de mantequilla de almendra.", serv:1 },
  { name:"Rollitos de pavo y queso", cat:"snack", emoji:"🥙", cal:180, prot:22, carb:4, fat:8, prep:5, diff:"facil", diet:["omnivoro"], tags:["pavo","queso","bajo-carbohidrato","proteico"], desc:"Fetas de pavo enrolladas con queso en láminas. Sin pan.", serv:1 },
  { name:"Tostadas de arroz con palta", cat:"snack", emoji:"🥑", cal:220, prot:4, carb:28, fat:12, prep:3, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["palta","sin-gluten","rapido","grasas-buenas"], desc:"Tortitas de arroz con palta machacada y semillas.", serv:1 },
  { name:"Gelatina de proteína", cat:"snack", emoji:"🍮", cal:80, prot:18, carb:2, fat:0, prep:5, diff:"facil", diet:["omnivoro","vegetariano","sin_gluten"], tags:["proteico","bajo-calorias","dulce"], desc:"Gelatina sin azúcar con scoop de proteína de vainilla. Postre fit.", serv:1 },
  { name:"Edamame al vapor", cat:"snack", emoji:"🌿", cal:160, prot:14, carb:14, fat:6, prep:10, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["soja","vegano","proteina-vegetal","japones"], desc:"Vainas de edamame al vapor con sal marina.", serv:1 },
  { name:"Chips de garbanzos tostados", cat:"snack", emoji:"🫘", cal:200, prot:10, carb:30, fat:6, prep:40, diff:"media", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["garbanzo","crujiente","vegano","proteina-vegetal"], desc:"Garbanzos cocidos tostados al horno con especias.", serv:2 },
  { name:"Batido de banana y mantequilla de maní", cat:"snack", emoji:"🍌", cal:320, prot:14, carb:42, fat:10, prep:3, diff:"facil", diet:["omnivoro","vegetariano","vegano"], tags:["banana","mani","batido","pre-entreno"], desc:"Banana con 1 cucharada de mantequilla de maní y leche o leche vegetal.", serv:1 },

  // ── POSTRES SALUDABLES ────────────────────────────────────────────────────────
  { name:"Mousse de chocolate y aguacate", cat:"postre", emoji:"🍫", cal:280, prot:6, carb:24, fat:18, prep:15, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["chocolate","aguacate","vegano","sin-azucar"], desc:"Aguacate maduro procesado con cacao puro y miel. Sin azúcar refinada.", serv:2 },
  { name:"Galletas de avena y banana", cat:"postre", emoji:"🍪", cal:240, prot:6, carb:44, fat:5, prep:20, diff:"facil", diet:["omnivoro","vegetariano","vegano"], tags:["avena","banana","horneado","sin-azucar"], desc:"Avena y banana aplastada con chispas de chocolate. Sin azúcar.", serv:8 },
  { name:"Helado de yogur con frutas", cat:"postre", emoji:"🍨", cal:150, prot:8, carb:24, fat:2, prep:240, diff:"facil", diet:["omnivoro","vegetariano","sin_gluten"], tags:["yogur","congelado","bajo-calorias","dulce"], desc:"Yogur griego congelado con frutas rojas. Menos de 150 kcal.", serv:2 },
  { name:"Brownie de batata y cacao", cat:"postre", emoji:"🍫", cal:200, prot:8, carb:32, fat:6, prep:40, diff:"media", diet:["omnivoro","vegetariano"], tags:["batata","cacao","horneado","fit"], desc:"Batata cocida procesada con cacao, huevo y miel. Fit y rico.", serv:6 },
  { name:"Cheesecake de ricota sin horno", cat:"postre", emoji:"🎂", cal:260, prot:14, carb:26, fat:12, prep:20, diff:"media", diet:["omnivoro","vegetariano"], tags:["ricota","sin-horno","proteico","dulce"], desc:"Base de galletitas con ricota, queso crema light y fruta.", serv:6 },
  { name:"Budín de chía con frutas", cat:"postre", emoji:"🍮", cal:180, prot:6, carb:28, fat:6, prep:10, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["chia","vegano","sin-gluten","rapido"], desc:"Semillas de chía hidratadas en leche vegetal con frutas frescas.", serv:1 },

  // ── MÁS ALMUERZOS / VARIEDAD ─────────────────────────────────────────────────
  { name:"Ceviche de merluza", cat:"almuerzo", emoji:"🍋", cal:280, prot:36, carb:18, fat:6, prep:30, diff:"media", diet:["omnivoro","sin_gluten"], tags:["merluza","limon","peru","bajo-carbohidrato"], desc:"Merluza marinada en limón con cebolla morada, cilantro y ají.", serv:2 },
  { name:"Milanesa de soja", cat:"almuerzo", emoji:"🌱", cal:420, prot:28, carb:48, fat:12, prep:20, diff:"facil", diet:["omnivoro","vegetariano","vegano"], tags:["soja","vegano","milanesa","proteina-vegetal"], desc:"Soja texturizada apanada al horno. Alternativa vegana a la milanesa.", serv:2 },
  { name:"Asado de tira a las brasas", cat:"almuerzo", emoji:"🥩", cal:750, prot:58, carb:0, fat:56, prep:60, diff:"dificil", diet:["omnivoro","sin_gluten"], tags:["carne","argentina","parrilla","proteico"], desc:"El clásico corte argentino a las brasas con chimichurri.", serv:2 },
  { name:"Tofu salteado con vegetales", cat:"almuerzo", emoji:"🌱", cal:380, prot:24, carb:22, fat:18, prep:20, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["tofu","vegano","oriental","proteina-vegetal"], desc:"Tofu firme salteado con brócoli, zanahoria y salsa tamari.", serv:1 },
  { name:"Pizza integral de verduras", cat:"almuerzo", emoji:"🍕", cal:520, prot:24, carb:68, fat:16, prep:60, diff:"media", diet:["omnivoro","vegetariano"], tags:["pizza","vegetariano","integral","horno"], desc:"Base integral con salsa de tomate, mozzarella y vegetales asados.", serv:2 },
  { name:"Guiso de porotos negros", cat:"almuerzo", emoji:"🫘", cal:480, prot:28, carb:62, fat:12, prep:60, diff:"media", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["porotos","legumbres","vegano","proteina-vegetal"], desc:"Porotos negros con cebolla, tomate, ajo y especias. Muy nutritivo.", serv:2 },
  { name:"Sushi casero de salmón", cat:"almuerzo", emoji:"🍣", cal:480, prot:28, carb:58, fat:14, prep:45, diff:"dificil", diet:["omnivoro"], tags:["sushi","salmon","japones","omega-3"], desc:"Rolls de arroz de sushi con salmón, palta y pepino.", serv:2 },
  { name:"Estofado de carne y verduras", cat:"almuerzo", emoji:"🥘", cal:580, prot:46, carb:38, fat:22, prep:75, diff:"media", diet:["omnivoro","sin_gluten"], tags:["carne","verduras","guiso","argentina"], desc:"Trozos de carne con papas, zanahorias, cebolla y caldo.", serv:3 },
  { name:"Quinoa con vegetales asados", cat:"almuerzo", emoji:"🥙", cal:420, prot:16, carb:62, fat:12, prep:35, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["quinoa","vegano","saludable","proteina-vegetal"], desc:"Quinoa con berenjenas, zucchini, morrón y aceite de oliva.", serv:1 },
  { name:"Pollo marinado al limón y ajo", cat:"almuerzo", emoji:"🍋", cal:480, prot:52, carb:8, fat:22, prep:30, diff:"facil", diet:["omnivoro","sin_gluten"], tags:["pollo","limon","proteico","grillado"], desc:"Muslos de pollo marinados con limón, ajo y hierbas, grillados.", serv:2 },
  { name:"Chili con carne", cat:"almuerzo", emoji:"🌶️", cal:580, prot:44, carb:48, fat:20, prep:50, diff:"media", diet:["omnivoro","sin_gluten"], tags:["carne","frijoles","mexicano","especiado"], desc:"Carne molida con frijoles, tomate, chile y especias.", serv:3 },
  { name:"Ensalada Niçoise", cat:"almuerzo", emoji:"🥗", cal:420, prot:32, carb:22, fat:22, prep:20, diff:"media", diet:["omnivoro","sin_gluten"], tags:["atun","huevo","frances","bajo-carbohidrato"], desc:"Atún, huevo duro, judías verdes, aceitunas y tomate con vinagreta.", serv:1 },
  { name:"Carne con hongos portobellos", cat:"almuerzo", emoji:"🍄", cal:520, prot:48, carb:10, fat:28, prep:30, diff:"media", diet:["omnivoro","sin_gluten"], tags:["carne","hongos","bajo-carbohidrato","premium"], desc:"Medallón de carne con champiñones portobellos salteados.", serv:1 },
  { name:"Lasaña de carne y espinaca", cat:"cena", emoji:"🍝", cal:680, prot:44, carb:62, fat:28, prep:80, diff:"dificil", diet:["omnivoro"], tags:["lasana","carne","italiano","horno"], desc:"Lasaña con salsa boloñesa, béchamel, espinaca y queso gratinado.", serv:4 },
  { name:"Fideos de zucchini con pesto", cat:"cena", emoji:"🌿", cal:320, prot:10, carb:18, fat:24, prep:20, diff:"facil", diet:["omnivoro","vegetariano"], tags:["zucchini","pesto","bajo-carbohidrato","vegetariano"], desc:"Zucchini en espiral con pesto de albahaca, piñones y parmesano.", serv:1 },
  { name:"Caldo de res con fideos", cat:"cena", emoji:"🍲", cal:380, prot:28, carb:38, fat:12, prep:120, diff:"media", diet:["omnivoro"], tags:["caldo","res","invierno","reconfortante"], desc:"Caldo casero de res con fideos y verduras.", serv:4 },
  { name:"Wrap de pavo y hummus", cat:"snack", emoji:"🌯", cal:320, prot:24, carb:32, fat:10, prep:5, diff:"facil", diet:["omnivoro"], tags:["pavo","hummus","practico","proteico"], desc:"Tortilla integral con hummus, pavo, lechuga y tomate.", serv:1 },
  { name:"Batido pre-entreno de café y avena", cat:"desayuno", emoji:"☕", cal:280, prot:14, carb:42, fat:6, prep:5, diff:"facil", diet:["omnivoro","vegetariano"], tags:["cafe","avena","pre-entreno","energetico"], desc:"Avena, café frío, banana y proteína licuados. Energía natural.", serv:1 },
  { name:"Tostadas con ricota y tomate", cat:"desayuno", emoji:"🍅", cal:280, prot:16, carb:32, fat:8, prep:5, diff:"facil", diet:["omnivoro","vegetariano"], tags:["ricota","tomate","proteico","liviano"], desc:"Tostadas con ricota, tomate cherry y orégano.", serv:1 },
  { name:"Smoothie bowl de mango", cat:"desayuno", emoji:"🥭", cal:320, prot:8, carb:62, fat:4, prep:8, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["mango","smoothie","tropical","vegano"], desc:"Base de mango y banana congelados con toppings de semillas y coco.", serv:1 },
  { name:"Ensalada de remolacha y naranja", cat:"almuerzo", emoji:"🫐", cal:220, prot:6, carb:42, fat:4, prep:10, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["remolacha","naranja","antioxidante","vegano"], desc:"Remolacha cocida con naranja, rúcula y semillas de zapallo.", serv:1 },
  { name:"Pollo con batata y ensalada", cat:"cena", emoji:"🍠", cal:520, prot:46, carb:42, fat:14, prep:40, diff:"facil", diet:["omnivoro","sin_gluten"], tags:["pollo","batata","equilibrado","proteico"], desc:"Pechuga de pollo al horno con batata asada y ensalada verde.", serv:1 },
  { name:"Guiso de pollo y garbanzos", cat:"cena", emoji:"🍲", cal:560, prot:48, carb:48, fat:14, prep:45, diff:"media", diet:["omnivoro","sin_gluten"], tags:["pollo","garbanzo","guiso","proteico"], desc:"Pollo con garbanzos, tomate, ajo y pimentón ahumado.", serv:2 },
  { name:"Carpaccio de zucchini", cat:"snack", emoji:"🥒", cal:140, prot:4, carb:10, fat:10, prep:10, diff:"facil", diet:["omnivoro","vegetariano","vegano","sin_gluten"], tags:["zucchini","crudo","liviano","vegano"], desc:"Zucchini en láminas finas con limón, aceite y parmesano (opc).", serv:1 },
  { name:"Sopa miso con tofu", cat:"cena", emoji:"🍜", cal:180, prot:14, carb:14, fat:6, prep:10, diff:"facil", diet:["omnivoro","vegetariano","vegano"], tags:["miso","tofu","japones","liviano"], desc:"Caldo dashi con pasta miso, tofu, cebollín y algas.", serv:1 },
  { name:"Tortilla española de papas", cat:"almuerzo", emoji:"🥚", cal:420, prot:18, carb:38, fat:22, prep:30, diff:"media", diet:["omnivoro","vegetariano","sin_gluten"], tags:["huevo","papa","español","tradicional"], desc:"Tortilla española con papas y cebolla. Clásico ibérico.", serv:3 },
  { name:"Arroz con leche (sin azúcar)", cat:"postre", emoji:"🍚", cal:240, prot:8, carb:42, fat:5, prep:40, diff:"facil", diet:["omnivoro","vegetariano"], tags:["arroz","leche","sin-azucar","clasico"], desc:"Arroz cocido en leche desnatada con canela y edulcorante.", serv:3 },
  { name:"Flan de huevo light", cat:"postre", emoji:"🍮", cal:160, prot:10, carb:22, fat:4, prep:45, diff:"media", diet:["omnivoro","vegetariano","sin_gluten"], tags:["huevo","flan","sin-azucar","proteico"], desc:"Flan casero con leche desnatada y edulcorante. Sin azúcar.", serv:4 },
];

export async function GET() {
  try {
    let count = 0;
    for (const r of RECIPES) {
      await prisma.recipe.upsert({
        where: { name: r.name } as any,
        create: {
          name: r.name,
          description: r.desc,
          calories: r.cal,
          proteinG: r.prot,
          carbsG: r.carb,
          fatsG: r.fat,
          category: r.cat,
          imageEmoji: r.emoji,
          tags: JSON.stringify(r.tags),
          prepMinutes: r.prep,
          difficulty: r.diff,
          servings: r.serv,
          dietTypes: JSON.stringify(r.diet),
          countryCode: "UY",
        },
        update: {
          description: r.desc,
          calories: r.cal,
          proteinG: r.prot,
          carbsG: r.carb,
          fatsG: r.fat,
          category: r.cat,
          imageEmoji: r.emoji,
          tags: JSON.stringify(r.tags),
          prepMinutes: r.prep,
          difficulty: r.diff,
          servings: r.serv,
          dietTypes: JSON.stringify(r.diet),
        },
      });
      count++;
    }
    return Response.json({ ok: true, seeded: count });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
