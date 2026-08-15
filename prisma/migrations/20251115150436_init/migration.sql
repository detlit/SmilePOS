/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `SettingEmployee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SettingEmployee_username_key" ON "SettingEmployee"("username");
