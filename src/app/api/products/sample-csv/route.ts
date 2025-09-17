// app/api/products/sample-csv/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const csvContent = `name,price,category,description
Caesar Salad,12.99,Appetizers,Fresh romaine lettuce with parmesan
Grilled Salmon,24.99,Main Courses,Atlantic salmon with lemon butter
Chocolate Cake,8.99,Desserts,Rich chocolate layer cake
Iced Tea,3.99,Beverages,Freshly brewed sweet tea
Margherita Pizza,18.99,Main Courses,Fresh tomato sauce with mozzarella
Chicken Wings,14.99,Appetizers,Buffalo-style chicken wings`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="sample-products.csv"'
    }
  })
}