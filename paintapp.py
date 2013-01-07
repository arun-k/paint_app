import webapp2
import jinja2
import os
import json
from google.appengine.ext import db
jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))
class Paint(db.Model):
    fname = db.StringProperty()
    img_data = db.TextProperty()

class MainPage(webapp2.RequestHandler):
    def get(self):
        all_data = Paint.all()
        py_all ={}    
        for each in all_data:
            py_all[each.fname] = each.img_data
        py_str = json.dumps(py_all)
        template_values = {'py_all': py_all , 'py_str': py_str}
        template = jinja_environment.get_template('paint.html')
        self.response.out.write(template.render(template_values))

    def post(self):
        file_name = self.request.get('fname')
        data = self.request.get('whole_data')
        paint = Paint(key_name = file_name)
        dkey = db.Key.from_path('Paint', file_name)
        existing = db.get(dkey)
        if existing:
            existing.fname = file_name
            existing.img_data = data
            existing.put()
        paint.fname = file_name
        paint.img_data = data
        paint.put()
     
app = webapp2.WSGIApplication([('/', MainPage)],
                              debug=True)
