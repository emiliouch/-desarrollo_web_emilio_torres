package adopciones.tarea4.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import adopciones.tarea4.services.AppService;

@Controller
public class AppController {

    private final AppService appService;

    public AppController(AppService appService) {
        this.appService = appService;
    }

    @GetMapping("/")
    public String root() {
        return "redirect:/avisos";
    }

    @GetMapping("/avisos")
    public String avisos() {
        return "avisos"; // templates/avisos.html
    }
}
